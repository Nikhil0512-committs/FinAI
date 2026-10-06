import re
with open('backend/database.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add simulated noise to the base_px
old_logic = """        data = self.CURATED_STOCK_MARKET_DATA.get(sym_upper)
        if data:
            base_px = float(data['base'])
            day_pct = float(data['day_pct'])
        else:
            h = abs(hash(sym_upper))
            base_px = float((h % 2200) + 150)
            day_pct = float((h % 100) / 100.0) - 0.5

        return {
            'symbol': sym_upper,
            'price': round(base_px, 2),
            'change_pct': round(day_pct, 2),
            'source': 'simulated',
            'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }"""

new_logic = """        data = self.CURATED_STOCK_MARKET_DATA.get(sym_upper)
        if data:
            base_px = float(data['base'])
            day_pct = float(data['day_pct'])
        else:
            h = abs(hash(sym_upper))
            base_px = float((h % 2200) + 150)
            day_pct = float((h % 100) / 100.0) - 0.5
            
        # Add live simulated volatility if market is closed or yfinance fails
        import random
        noise = (random.random() - 0.5) * (base_px * 0.002) # 0.2% volatility
        sim_px = base_px + noise

        return {
            'symbol': sym_upper,
            'price': round(sim_px, 2),
            'change_pct': round(day_pct + (noise/base_px)*100, 2),
            'source': 'simulated',
            'time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }"""

content = content.replace(old_logic, new_logic)

with open('backend/database.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Simulated volatility added!")
