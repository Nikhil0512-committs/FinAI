import re

with open('backend/database.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace get_local_latest_quote
old_get_local = '''        # 2. Check yfinance engine for real live price
        try:
            from yfinance_engine import yfinance_engine
            live_px = yfinance_engine.get_live_price(sym_upper)
            if live_px and live_px > 0:
                return {
                    'symbol': sym_upper,
                    'price': round(float(live_px), 2),
                    'change_pct': 0.0,
                    'source': 'yahoo_finance',
                    'time': datetime.now().strftime('%Y-%m-%d %H:%M')
                }
        except Exception:
            pass'''

new_get_local = '''        # 2. Check yfinance engine for real live price
        try:
            from yfinance_engine import yfinance_engine
            quotes = yfinance_engine.get_live_quotes([sym_upper])
            if quotes and len(quotes) > 0:
                quote = quotes[0]
                if quote.get('price') and quote['price'] > 0:
                    return {
                        'symbol': sym_upper,
                        'price': round(float(quote['price']), 2),
                        'change_pct': quote.get('change_pct', 0.0),
                        'source': 'yahoo_finance',
                        'time': datetime.now().strftime('%Y-%m-%d %H:%M')
                    }
        except Exception:
            pass'''
content = content.replace(old_get_local, new_get_local)

# Replace get_live_stock_snapshot
old_snapshot = '''        from dhan_engine import dhan_engine
        from fyers_engine import fyers_engine

        stocks = self.get_stock_list()[:limit]
        symbols = [s['symbol'] for s in stocks]
        quote_map = {}

        for quote in dhan_engine.get_live_quotes(symbols):
            quote_map[quote['symbol']] = quote

        missing = [s for s in symbols if s not in quote_map]
        for quote in fyers_engine.get_live_quotes(missing):
            quote_map[quote['symbol']] = quote

        result = []
        for stock in stocks:
            symbol = stock['symbol']
            quote = quote_map.get(symbol)
            if not quote or quote.get('price') is None:
                quote = self.get_local_latest_quote(symbol)
            result.append({**stock, **quote})'''

new_snapshot = '''        from dhan_engine import dhan_engine
        from fyers_engine import fyers_engine
        from yfinance_engine import yfinance_engine

        stocks = self.get_stock_list()[:limit]
        symbols = [s['symbol'] for s in stocks]
        quote_map = {}

        for quote in dhan_engine.get_live_quotes(symbols):
            quote_map[quote['symbol']] = quote

        missing = [s for s in symbols if s not in quote_map]
        for quote in fyers_engine.get_live_quotes(missing):
            quote_map[quote['symbol']] = quote
            
        missing_from_apis = [s for s in symbols if s not in quote_map]
        if missing_from_apis:
            for quote in yfinance_engine.get_live_quotes(missing_from_apis):
                quote_map[quote['symbol']] = quote

        # Fill missing change_pct (e.g. from Dhan)
        missing_change_pct = [s for s, q in quote_map.items() if q.get('change_pct') is None]
        if missing_change_pct:
            for quote in yfinance_engine.get_live_quotes(missing_change_pct):
                if quote['symbol'] in quote_map:
                    quote_map[quote['symbol']]['change_pct'] = quote.get('change_pct', 0.0)

        result = []
        for stock in stocks:
            symbol = stock['symbol']
            quote = quote_map.get(symbol)
            if not quote or quote.get('price') is None:
                quote = self.get_local_latest_quote(symbol)
            if quote and quote.get('change_pct') is None:
                quote['change_pct'] = 0.0
            result.append({**stock, **quote})'''
content = content.replace(old_snapshot, new_snapshot)

with open('backend/database.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated database.py")
