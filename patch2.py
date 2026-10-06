import re

with open('backend/database.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace execute_paper_trade setup
old_setup = '''        sl_val = float(stop_loss) if stop_loss and float(stop_loss) > 0 else None
        tp_val = float(take_profit) if take_profit and float(take_profit) > 0 else None

        if order_type == 'AMO':'''

new_setup = '''        sl_val = float(stop_loss) if stop_loss and float(stop_loss) > 0 else None
        tp_val = float(take_profit) if take_profit and float(take_profit) > 0 else None

        if sl_val is not None:
            if side_upper == 'BUY' and sl_val >= price:
                raise ValueError(f"For BUY orders, Stop Loss ({sl_val}) must be strictly less than execution price ({price}).")
            if side_upper == 'SELL' and sl_val <= price:
                raise ValueError(f"For SELL orders, Stop Loss ({sl_val}) must be strictly greater than execution price ({price}).")

        if tp_val is not None:
            if side_upper == 'BUY' and tp_val <= price:
                raise ValueError(f"For BUY orders, Take Profit ({tp_val}) must be strictly greater than execution price ({price}).")
            if side_upper == 'SELL' and tp_val >= price:
                raise ValueError(f"For SELL orders, Take Profit ({tp_val}) must be strictly less than execution price ({price}).")

        if order_type == 'AMO':'''
content = content.replace(old_setup, new_setup)

with open('backend/database.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated database.py")
