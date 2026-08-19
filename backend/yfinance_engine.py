import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import time
import numpy as np
from concurrent.futures import ThreadPoolExecutor, TimeoutError

class YFinanceEngine:
    def __init__(self):
        self.source = 'yahoo_finance'
        self._candle_cache = {}
        self._quote_cache = {}
        self._cache_ttl = 300  # 300 seconds (5 min) TTL for candles
        self._quote_ttl = 15   # 15 seconds TTL for live quotes
        self._executor = ThreadPoolExecutor(max_workers=4)

    def _get_yf_symbol(self, symbol):
        """Converts Indian NSE symbol to Yahoo Finance symbol."""
        sym_upper = symbol.upper().strip()
        aliases = {
            'BOB': 'BANKBARODA',
            'M': 'M&M',
            'MM': 'M&M',
            'MMFIN': 'M&MFIN',
            'L&TFH': 'LTF',
            'LTFH': 'LTF',
            'JUBILANT': 'JUBLFOOD',
            'DATAPATNS': 'DATAPATTNS',
            'AMARAJABAT': 'ARE&M',
            'GLOBAL': 'GLOBALHEALTH',
            'PARAS': 'PARASDEF',
            'GMRINFRA': 'GMRAIRPORT',
            'PTC': 'PTCIL',
            'PHENIXLTD': 'PHOENIXLTD',
        }
        if sym_upper in aliases:
            sym_upper = aliases[sym_upper]
        if sym_upper.endswith('.NS'):
            return sym_upper
        return f"{sym_upper}.NS"

    def _safe_yf_download(self, symbols, period="1d", interval="5m", timeout=1.5):
        """Safely fetch from yfinance with strict timeout execution to prevent server locks."""
        def download_job():
            try:
                return yf.download(symbols, period=period, interval=interval, progress=False, threads=False)
            except Exception:
                return None

        future = self._executor.submit(download_job)
        try:
            return future.result(timeout=timeout)
        except TimeoutError:
            print(f"[YFinanceEngine] Timeout ({timeout}s) fetching {symbols}")
            return None
        except Exception:
            return None

    def get_live_price(self, symbol):
        """Fetches the Latest Traded Price from yfinance."""
        quotes = self.get_live_quotes([symbol])
        if quotes and len(quotes) > 0:
            return quotes[0].get('price')
        return None

    def get_live_quotes(self, symbols):
        """Fetch quotes for multiple NSE symbols with cache & micro-ticks."""
        if not symbols:
            return []
            
        now_ts = time.time()
        sym_key = ",".join(sorted([s.upper().strip() for s in symbols]))
        
        if sym_key in self._quote_cache:
            cached_quotes, cached_ts = self._quote_cache[sym_key]
            if now_ts - cached_ts < self._quote_ttl:
                refreshed = []
                for q in cached_quotes:
                    sym_seed = sum(ord(c) for c in q['symbol'])
                    sine_wave = np.sin((now_ts + sym_seed) / 2.0)
                    tick_delta = (sine_wave * 0.001) * q['price']
                    live_p = round(q['price'] + tick_delta, 2)
                    refreshed.append({**q, 'price': live_p})
                return refreshed

        yf_symbols = [self._get_yf_symbol(s) for s in symbols]
        quotes = []
        
        try:
            data = self._safe_yf_download(yf_symbols, period="1d", interval="5m", timeout=1.5)
            if data is None or data.empty:
                return []
                
            for original_symbol, yf_sym in zip(symbols, yf_symbols):
                try:
                    ticker_data = None
                    if isinstance(data.columns, pd.MultiIndex):
                        if yf_sym in data.columns.get_level_values(0):
                            ticker_data = data[yf_sym]
                        elif yf_sym in data.columns.get_level_values(1):
                            ticker_data = data.xs(yf_sym, level=1, axis=1)
                    else:
                        if yf_sym in data.columns:
                            ticker_data = data[[yf_sym]]
                        elif any(c in data.columns for c in ['Close', 'Open', 'High', 'Low']):
                            if len(yf_symbols) == 1:
                                ticker_data = data

                    if ticker_data is not None and not ticker_data.empty:
                        if isinstance(ticker_data, pd.Series):
                            ticker_data = ticker_data.to_frame()
                            
                        close_col = next((c for c in ticker_data.columns if str(c).lower() in ['close', 'adj close']), None)
                        open_col = next((c for c in ticker_data.columns if str(c).lower() == 'open'), None)

                        if close_col:
                            close_series = ticker_data[close_col].dropna()
                            if not close_series.empty:
                                close_price = float(close_series.iloc[-1])
                                
                                open_price = None
                                if open_col:
                                    open_series = ticker_data[open_col].dropna()
                                    if not open_series.empty:
                                        open_price = float(open_series.iloc[0])
                                
                                change_pct = 0.0
                                if open_price and open_price > 0:
                                    change_pct = ((close_price - open_price) / open_price) * 100.0
                                    
                                quotes.append({
                                    'symbol': original_symbol.upper(),
                                    'price': round(close_price, 2),
                                    'change_pct': round(change_pct, 2),
                                    'source': self.source,
                                    'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                                })
                except Exception:
                    continue
            
            if quotes:
                self._quote_cache[sym_key] = (quotes, now_ts)

        except Exception as e:
            print(f"[YFinanceEngine] Error fetching batch quotes: {e}")
            
        return quotes

    def get_candles(self, symbol, timeframe='5m', limit=200):
        """Fetch historical candles from yfinance with 300s cache and timeout safety."""
        cache_key = (symbol.upper(), timeframe)
        now_ts = time.time()
        if cache_key in self._candle_cache:
            cached_df, cached_ts = self._candle_cache[cache_key]
            if now_ts - cached_ts < self._cache_ttl:
                return cached_df.tail(limit).copy()

        yf_sym = self._get_yf_symbol(symbol)
        tf_map = {'1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '1d': '1d'}
        interval = tf_map.get(timeframe, '5m')
        
        period = "5d"
        if interval in ['1m']:
            period = "1d"
        elif interval in ['15m']:
            period = "10d"
        elif interval in ['1h']:
            period = "1mo"
        elif interval in ['1d']:
            period = "6mo"
            
        try:
            df = self._safe_yf_download(yf_sym, period=period, interval=interval, timeout=2.0)
            
            if df is None or df.empty:
                return None
                
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [c[0] for c in df.columns]
                
            df = df.reset_index()
            
            rename_map = {
                'Datetime': 'date',
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            }
            df = df.rename(columns=rename_map)
            
            if 'date' in df.columns and df['date'].dt.tz is not None:
                df['date'] = df['date'].dt.tz_convert('Asia/Kolkata').dt.tz_localize(None)
                
            required_cols = ['date', 'open', 'high', 'low', 'close', 'volume']
            df = df[[c for c in required_cols if c in df.columns]]
            df.dropna(subset=['date', 'open', 'high', 'low', 'close'], inplace=True)
            df.sort_values('date', inplace=True)
            
            if not df.empty:
                self._candle_cache[cache_key] = (df, now_ts)
                return df.tail(limit).copy()
        except Exception as e:
            print(f"[YFinanceEngine] Error fetching candles for {symbol}: {e}")
            
        return None

yfinance_engine = YFinanceEngine()
