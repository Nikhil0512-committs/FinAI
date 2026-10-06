import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from dhan_engine import dhan_engine
from fyers_engine import fyers_engine
from yfinance_engine import yfinance_engine

print('Dhan:', dhan_engine.get_live_quotes(['RELIANCE']))
print('Fyers:', fyers_engine.get_live_quotes(['RELIANCE']))
print('YFinance:', yfinance_engine.get_live_quotes(['RELIANCE']))
