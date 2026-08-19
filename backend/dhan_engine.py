import time
import requests
import pandas as pd
from datetime import datetime, timedelta
from dhanhq import dhanhq, DhanContext

class DhanEngine:
    def __init__(self):
        import threading
        self.dhan_instance = None
        self.last_auth_time = 0
        self.AUTH_TTL = 3600 * 24
        # Pre-seed with top NSE equities
        self.symbol_map = {
            'RELIANCE': '2885', 'TCS': '11536', 'HDFCBANK': '1333', 'INFY': '1594',
            'ICICIBANK': '4963', 'ADANIENT': '25', 'TATAMOTORS': '3456', 'SBIN': '3045',
            'BHARTIARTL': '10604', 'ITC': '1660', 'LT': '11483', 'KOTAKBANK': '1922',
            'HINDUNILVR': '1394', 'AXISBANK': '5900', 'BAJFINANCE': '317', 'BAJAJFINSV': '16675',
            'MARUTI': '10999', 'ASIANPAINT': '236', 'SUNPHARMA': '3351', 'TITAN': '3506',
            'WIPRO': '3787', 'HCLTECH': '7229', 'ULTRACEMCO': '11532', 'NTPC': '11630',
            'POWERGRID': '14977', 'ONGC': '2475', 'TATASTEEL': '3499', 'COALINDIA': '20374',
            'JSWSTEEL': '11723', 'M&M': '2031', 'ADANIPORTS': '15083', 'CIPLA': '694',
            'DRREDDY': '881', 'APOLLOHOSP': '157', 'DIVISLAB': '10940', 'EICHERMOT': '910',
            'HEROMOTOCO': '1348', 'BAJAJ-AUTO': '16669', 'NESTLEIND': '17963', 'BRITANNIA': '547',
            'TECHM': '13538', 'INDUSINDBK': '5258', 'TATACONSUM': '3432', 'ZOMATO': '5097'
        }
        self.symbol_map_reverse = {v: k for k, v in self.symbol_map.items()}
        
        # Load full Scrip Master in a non-blocking background thread
        threading.Thread(target=self._load_symbol_map, daemon=True).start()

    def _load_symbol_map(self):
        """Downloads and maps Dhan Security IDs to symbols asynchronously"""
        try:
            url = "https://images.dhan.co/api-data/api-scrip-master.csv"
            df = pd.read_csv(url, low_memory=False)
            df_nse = df[(df['SEM_EXM_EXCH_ID'] == 'NSE') & (df['SEM_SERIES'] == 'EQ')]
            for _, row in df_nse.iterrows():
                symbol = str(row['SEM_CUSTOM_SYMBOL']).strip().upper()
                if not symbol or 'TEST' in symbol or symbol[0].isdigit() or len(symbol) > 15:
                    continue
                sec_id = str(row['SEM_SMST_SECURITY_ID'])
                self.symbol_map[symbol] = sec_id
                self.symbol_map_reverse[sec_id] = symbol
            print(f"[DhanEngine] Loaded {len(self.symbol_map)} clean NSE symbols in background.")
        except Exception as e:
            print(f"[DhanEngine] Background Scrip Master load info: {e}")

    def _authenticate(self):
        from database import db
        keys = db.get_api_keys()
        client_id = keys.get('dhan_client_id')
        access_token = keys.get('dhan_access_token')

        if not client_id or not access_token:
            return False

        if self.dhan_instance and (time.time() - self.last_auth_time < self.AUTH_TTL):
            return True

        try:
            try:
                self.dhan_instance = dhanhq(DhanContext(client_id, access_token))
            except TypeError:
                self.dhan_instance = dhanhq(client_id, access_token)
            self.last_auth_time = time.time()
            return True
        except Exception as e:
            print(f"[DhanEngine] Authentication Error: {e}")
            self.dhan_instance = None
            return False

    def get_live_price(self, symbol):
        """Fetches the Latest Traded Price (LTP) from Dhan"""
        quotes = self.get_live_quotes([symbol])
        return quotes[0]['price'] if quotes else None

    def get_live_quotes(self, symbols):
        """Fetch API-only LTP snapshots for multiple NSE symbols from Dhan."""
        if not self._authenticate():
            return []

        securities = []
        symbol_by_sec_id = {}
        for symbol in symbols:
            sec_id = self.symbol_map.get(symbol)
            if not sec_id:
                continue
            sec_id_int = int(sec_id)
            securities.append(sec_id_int)
            symbol_by_sec_id[str(sec_id_int)] = symbol

        if not securities:
            return []

        quotes = []
        try:
            response = self.dhan_instance.ticker_data({
                self.dhan_instance.NSE: securities
            })
            if not response or response.get('status') != 'success':
                return []

            data = response.get('data', {})
            exchange_data = data.get(self.dhan_instance.NSE, data)
            for sec_id, values in exchange_data.items():
                symbol = symbol_by_sec_id.get(str(sec_id))
                if not symbol or not isinstance(values, dict):
                    continue
                ltp = values.get('last_price') or values.get('LTP') or values.get('ltp')
                if ltp is None:
                    continue
                quotes.append({
                    'symbol': symbol,
                    'price': round(float(ltp), 2),
                    'change_pct': None,
                    'source': 'dhan',
                    'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
        except Exception as e:
            print(f"[DhanEngine] Error fetching live quote batch: {e}")
        return quotes

    def get_candles(self, symbol, timeframe='5m', limit=200):
        if not self._authenticate():
            return None

        sec_id = self.symbol_map.get(symbol)
        if not sec_id:
            return None

        to_date = datetime.now()
        
        # Dhan has intraday_minute_data (1, 5, 15, 25, 60) and historical_daily_data
        try:
            if timeframe == '1d':
                from_date = to_date - timedelta(days=200)
                response = self.dhan_instance.historical_daily_data(
                    security_id=sec_id,
                    exchange_segment=self.dhan_instance.NSE,
                    instrument_type='EQUITY',
                    expiry_code=0,
                    from_date=from_date.strftime('%Y-%m-%d'),
                    to_date=to_date.strftime('%Y-%m-%d')
                )
            else:
                tf_map = {'1m': '1', '5m': '5', '15m': '15', '1h': '60'}
                res = tf_map.get(timeframe, '5')
                from_date = to_date - timedelta(days=30)
                response = self.dhan_instance.intraday_minute_data(
                    security_id=sec_id,
                    exchange_segment=self.dhan_instance.NSE,
                    instrument_type='EQUITY',
                    from_date=from_date.strftime('%Y-%m-%d'),
                    to_date=to_date.strftime('%Y-%m-%d'),
                    interval=res
                )

            if response and response.get('status') == 'success':
                data = response.get('data', {})
                if not data or 'start_Time' not in data:
                    return None
                    
                df = pd.DataFrame({
                    'epoch': data['start_Time'],
                    'open': data['open'],
                    'high': data['high'],
                    'low': data['low'],
                    'close': data['close'],
                    'volume': data['volume']
                })
                
                # Convert dhan epoch to datetime, assuming it is standard UTC
                df['date'] = pd.to_datetime(df['epoch'], unit='s') + pd.Timedelta(hours=5, minutes=30)
                df.drop(columns=['epoch'], inplace=True)
                
                return df.tail(limit * 5)
                
        except Exception as e:
            print(f"[DhanEngine] Error fetching history for {symbol}: {e}")
            
        return None
        
    def get_all_symbols(self):
        return sorted(list(self.symbol_map.keys()))

dhan_engine = DhanEngine()
