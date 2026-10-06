with open('backend/app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add logic to close open position at the end of the loop
target_str = """        equity_curve.append(round(balance, 2))
        
    wins = [t for t in trades if t['win']]"""

replacement_str = """        equity_curve.append(round(balance, 2))
        
    # Close any open position at the end of the simulation
    if position is not None:
        entry_p = position['entry_price']
        final_price = float(candles[-1]['close'])
        pct_change = ((final_price - entry_p) / entry_p) * 100.0
        pnl = (final_price - entry_p) * position['qty']
        balance += pnl
        trades.append({
            'entry_price': round(entry_p, 2),
            'exit_price': round(final_price, 2),
            'pnl': round(pnl, 2),
            'pnl_pct': round(pct_change, 2),
            'win': pnl > 0
        })
        equity_curve[-1] = round(balance, 2)
        
    wins = [t for t in trades if t['win']]"""

content = content.replace(target_str, replacement_str)

with open('backend/app.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added end-of-loop position closing!")
