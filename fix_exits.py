with open('backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

target_exit = """if pct_change >= tp_pct or pct_change <= -sl_pct or (strat == "RSI_MEAN_REVERSION" and rsi > 62):"""

replacement_exit = """indicator_exit = False
            if strat == "RSI_MEAN_REVERSION" and rsi > 62:
                indicator_exit = True
            elif strat == "SMA_BREAKOUT" and price < sma20:
                indicator_exit = True
            elif strat == "EMA_CROSS" and ema9 < sma20:
                indicator_exit = True
                
            if pct_change >= tp_pct or pct_change <= -sl_pct or indicator_exit:"""

content = content.replace(target_exit, replacement_exit)

with open('backend/app.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed exit conditions!")
