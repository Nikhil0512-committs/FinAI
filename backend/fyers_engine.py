from fyers_apiv3 import fyersModel
import time
from datetime import datetime, timedelta
import pandas as pd
import requests

class FyersEngine:
    def __init__(self):
        self.fyers_instance = None
        self.last_auth_time = 0
        self.AUTH_TTL = 3600 * 24 # 24 hours

    def _authenticate(self):
        from database import db
        keys = db.get_api_keys()
        app_id = keys.get('fyers_app_id')
        access_token = keys.get('fyers_access_token')

        if not app_id or not access_token:
            return False

        if self.fyers_instance and (time.time() - self.last_auth_time < self.AUTH_TTL):
            return True

        try:
            self.fyers_instance = fyersModel.FyersModel(
                client_id=app_id,
                is_async=False,
                token=access_token,
                log_path=""
            )
            self.last_auth_time = time.time()
            return True
        except Exception as e:
            print(f"[FyersEngine] Authentication Error: {e}")
            self.fyers_instance = None
            return False

    def get_live_price(self, symbol):
        """
        Fetches the Latest Traded Price (LTP) from Fyers.
        Returns the LTP if successful, otherwise returns None.
        """
        if not self._authenticate():
            return None

        # Fyers uses symbols like NSE:RELIANCE-EQ
        fyers_symbol = f"NSE:{symbol}-EQ"
        data = {"symbols": fyers_symbol}

        try:
            response = self.fyers_instance.quotes(data=data)
            if response and response.get("s") == "ok":
                # Fyers quotes response format: 
                # 'd': [{'v': {'lp': 2500.0, ...}, 'n': 'NSE:RELIANCE-EQ'}]
                quotes_list = response.get('d', [])
                if quotes_list:
                    quote_data = quotes_list[0].get('v', {})
                    ltp = quote_data.get('lp')
                    if ltp is not None:
                        return float(ltp)
        except Exception as e:
            print(f"[FyersEngine] Error fetching live price for {symbol}: {e}")
            
        return None

    def get_live_quotes(self, symbols, chunk_size=50):
        """Fetch latest quotes from Fyers in chunks."""
        if not symbols or not self._authenticate():
            return []

        quotes = []
        for i in range(0, len(symbols), chunk_size):
            chunk = symbols[i:i + chunk_size]
            data = {"symbols": ",".join([f"NSE:{symbol}-EQ" for symbol in chunk])}
            try:
                response = self.fyers_instance.quotes(data=data)
                if not response or response.get("s") != "ok":
                    continue
                for item in response.get('d', []):
                    name = item.get('n', '')
                    values = item.get('v', {})
                    symbol = name.replace('NSE:', '').replace('-EQ', '')
                    ltp = values.get('lp')
                    if ltp is None:
                        continue
                    prev_close = values.get('prev_close_price') or values.get('cmd', {}).get('c')
                    change_pct = None
                    if prev_close:
                        change_pct = round(((float(ltp) - float(prev_close)) / (float(prev_close) + 1e-9)) * 100.0, 2)
                    quotes.append({
                        'symbol': symbol,
                        'price': round(float(ltp), 2),
                        'change_pct': change_pct,
                        'source': 'fyers',
                        'time': datetime.now().strftime('%Y-%m-%d %H:%M')
                    })
            except Exception as e:
                print(f"[FyersEngine] Error fetching live quote chunk: {e}")
        return quotes

    def get_candles(self, symbol, timeframe='5m', limit=200):
        if not self._authenticate():
            return None

        # Map our timeframes to Fyers resolution
        tf_map = {'1m': '1', '5m': '5', '15m': '15', '1h': '60', '1d': 'D'}
        res = tf_map.get(timeframe, '5')

        # We will fetch a dynamic range (e.g., last 30 days) to ensure we get enough data
        to_date = datetime.now()
        from_date = to_date - timedelta(days=45)

        fyers_symbol = f"NSE:{symbol}-EQ"
        data = {
            "symbol": fyers_symbol,
            "resolution": res,
            "date_format": "1", # yyyy-mm-dd
            "range_from": from_date.strftime('%Y-%m-%d'),
            "range_to": to_date.strftime('%Y-%m-%d'),
            "cont_flag": "1"
        }

        try:
            response = self.fyers_instance.history(data=data)
            if response and response.get('s') == 'ok':
                candles_data = response.get('candles', [])
                if not candles_data:
                    return None
                
                # Fyers format: [epoch, open, high, low, close, volume]
                df = pd.DataFrame(candles_data, columns=['epoch', 'open', 'high', 'low', 'close', 'volume'])
                df['date'] = pd.to_datetime(df['epoch'], unit='s') + pd.Timedelta(hours=5, minutes=30)
                df.drop(columns=['epoch'], inplace=True)
                
                return df.tail(limit * 5) # Return a bit more for technical indicator calculations
        except Exception as e:
            print(f"[FyersEngine] Error fetching history for {symbol}: {e}")
            
        return None
        
    def get_all_symbols(self):
        """Fetches all NSE Equity symbols from the Fyers public master CSV"""
        try:
            # Fyers provides a public CSV with all NSE CM symbols
            csv_url = "https://public.fyers.in/sym_details/NSE_CM.csv"
            response = requests.get(csv_url)
            response.raise_for_status()
            
            symbols = []
            for line in response.text.split('\n'):
                if line.strip():
                    parts = line.split(',')
                    if len(parts) > 13:
                        # parts[1] is like NSE:RELIANCE-EQ
                        # parts[13] is usually the base symbol like RELIANCE, but let's parse from parts[1] for safety
                        sym_full = parts[1]
                        if '-EQ' in sym_full and sym_full.startswith('NSE:'):
                            base_sym = sym_full.replace('NSE:', '').replace('-EQ', '')
                            symbols.append(base_sym)
            
            # Sort and return unique symbols
            return sorted(list(set(symbols)))
        except Exception as e:
            print(f"[FyersEngine] Error fetching symbol master: {e}")
            return []

fyers_engine = FyersEngine()
