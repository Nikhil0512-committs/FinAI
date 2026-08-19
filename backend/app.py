import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict

from database import db
from behavioral_engine import behavioral_engine
from xai_engine import xai_engine
from rag_engine import rag_engine
from fyers_engine import fyers_engine
from dhan_engine import dhan_engine
from yfinance_engine import yfinance_engine

app = FastAPI(
    title="FinAI API",
    description="AI Market Intelligence & Paper-Trading Behavioral Coach API",
    version="6.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class EvaluateTradeRequest(BaseModel):
    user_id: Optional[str] = 'default_user'
    symbol: str
    side: str
    quantity: int
    price: float
    sentiment_tag: Optional[str] = 'Neutral'

class ExecuteTradeRequest(BaseModel):
    user_id: str
    symbol: str
    side: str
    quantity: int
    price: float
    sentiment_tag: Optional[str] = 'Neutral'
    accept_cooling_off: Optional[bool] = False
    product_type: Optional[str] = 'DELIVERY'
    order_type: Optional[str] = 'MARKET'
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class CloseTradeRequest(BaseModel):
    trade_code: str
    exit_price: Optional[float] = None

class StrategyBacktestRequest(BaseModel):
    symbol: str
    strategy: Optional[str] = "RSI_MEAN_REVERSION"
    timeframe: Optional[str] = "5m"
    stop_loss_pct: Optional[float] = 1.5
    take_profit_pct: Optional[float] = 3.0

class PostMortemRequest(BaseModel):
    trade_code: str

class ApiKeysPayload(BaseModel):
    gemini_api_key: Optional[str] = ''
    fyers_app_id: Optional[str] = ''
    fyers_secret_id: Optional[str] = ''
    fyers_redirect_url: Optional[str] = ''
    fyers_access_token: Optional[str] = ''
    dhan_client_id: Optional[str] = ''
    dhan_access_token: Optional[str] = ''
    claude_api_key: Optional[str] = ''

@app.get("/api/health")
def health_check():
    keys = db.get_api_keys()
    gemini_active = bool(keys.get('gemini_api_key'))
    fyers_active = bool(keys.get('fyers_app_id') and keys.get('fyers_access_token'))
    dhan_active = bool(keys.get('dhan_client_id') and keys.get('dhan_access_token'))
    return {
        "status": "ok", 
        "app": "FinAI Engine", 
        "mode": "Educational Paper-Trading (SEBI Regulator-Safe)",
        "market_open": db.is_market_open(),
        "active_keys": {
            "gemini": gemini_active,
            "fyers": fyers_active,
            "dhan": dhan_active
        }
    }

@app.get("/api/market-status")
def get_market_status():
    from datetime import datetime
    import pytz
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(ist)
    is_open = db.is_market_open()
    return {
        "is_open": is_open,
        "current_time_ist": now_ist.strftime('%Y-%m-%d %H:%M:%S IST'),
        "session": "LIVE_MARKET" if is_open else "AMO_OFF_MARKET_QUEUED",
        "next_open": "09:15 AM IST" if not is_open else "Active Now"
    }

@app.get("/api/stocks")
def list_stocks():
    return {"stocks": db.get_stock_list()}

@app.get("/api/live-stocks")
def list_live_stocks(limit: int = Query(500, ge=1, le=2000)):
    return {"stocks": db.get_live_stock_snapshot(limit=limit)}

@app.get("/api/quote/{symbol}")
def get_live_quote(symbol: str):
    quote = next((q for q in dhan_engine.get_live_quotes([symbol.upper()]) if q.get('price') is not None), None)
    if quote is None:
        quote = next((q for q in fyers_engine.get_live_quotes([symbol.upper()]) if q.get('price') is not None), None)
    if quote is None:
        quote = next((q for q in yfinance_engine.get_live_quotes([symbol.upper()]) if q.get('price') is not None), None)
    if quote is None:
        quote = db.get_local_latest_quote(symbol.upper())
    if quote is None:
        raise HTTPException(
            status_code=503,
            detail=f"Live quote unavailable for {symbol.upper()} from Dhan/Fyers/Yahoo and Local Dataset."
        )
    return quote

@app.get("/api/candles/{symbol}")
def get_candles(symbol: str, timeframe: str = Query('5m', enum=['1m', '5m', '15m', '1h', '1d']), limit: int = 150):
    return db.get_stock_candles(symbol, timeframe=timeframe, limit=limit)

@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    try:
        user = db.register_user(req.username, req.email, req.password)
        return {"status": "SUCCESS", "user": user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
def login_user(req: LoginRequest):
    try:
        user = db.authenticate_user(req.username, req.password)
        return {"status": "SUCCESS", "user": user}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/api/portfolio")
def get_portfolio(user_id: str = 'default_user'):
    db.process_sl_tp_triggers()
    db.process_amo_executions(user_id)
    db.process_eod_square_off(user_id)
    portfolio = db.get_portfolio(user_id)
    trade_count = db.get_trade_count(user_id)
    unlocked = trade_count >= 6
    discipline_score = max(40, min(95, 85 - (trade_count * 2) if not unlocked else 92))
    
    return {
        "portfolio": portfolio,
        "trade_count": trade_count,
        "profile_unlocked": unlocked,
        "activation_threshold": 8,
        "discipline_score": discipline_score
    }

@app.post("/api/trade/evaluate")
def evaluate_trade(req: EvaluateTradeRequest):
    history = db.get_trade_history(req.user_id)
    pending = req.dict()
    market_features = db.get_behavioral_market_features(req.symbol)
    risk_eval = behavioral_engine.evaluate_trade_risk(history, pending, market_features=market_features)
    
    keys = db.get_api_keys()
    gemini_key = keys.get('gemini_api_key')

    xai_receipt = None
    if risk_eval['has_risk']:
        xai_receipt = xai_engine.generate_xai_receipt(risk_eval, history, pending, gemini_api_key=gemini_key)
        
    return {
        "risk_evaluation": risk_eval,
        "xai_receipt": xai_receipt
    }

@app.post("/api/trade/execute")
def execute_trade(req: ExecuteTradeRequest):
    # Try Dhan first, fallback to Fyers, then Yahoo, then Local Dataset
    live_price = dhan_engine.get_live_price(req.symbol)
    if live_price is None:
        live_price = fyers_engine.get_live_price(req.symbol)
    if live_price is None:
        live_price = yfinance_engine.get_live_price(req.symbol)
    if live_price is None:
        local_quote = db.get_local_latest_quote(req.symbol)
        if local_quote:
            live_price = local_quote.get('price')

    if live_price is None and req.price and float(req.price) > 0:
        live_price = float(req.price)

    if live_price is None:
        live_price = 1500.0

    try:
        trade = db.execute_paper_trade(
            user_id=req.user_id,
            symbol=req.symbol,
            side=req.side,
            quantity=req.quantity,
            price=req.price,
            sentiment_tag=req.sentiment_tag,
            product_type=req.product_type or 'DELIVERY',
            order_type=req.order_type or 'MARKET',
            stop_loss=req.stop_loss,
            take_profit=req.take_profit
        )
        
        if trade.get('status') == 'AMO_PENDING':
            return {
                "status": "AMO_QUEUED",
                "message": f"After Market Order (AMO) for {req.symbol} queued successfully! Order will execute automatically at 09:15 AM IST market open.",
                "trade": trade
            }

        return {
            "status": "EXECUTED",
            "message": f"Order EXECUTED successfully for {req.quantity} shares of {req.symbol} @ ₹{req.price:.2f}",
            "trade": trade
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/trade/close")
def close_trade(req: CloseTradeRequest):
    try:
        closed_trade = db.close_paper_trade(req.trade_code, req.exit_price)
        return {"status": "SUCCESS", "trade": closed_trade}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/trades")
def get_trades(user_id: str = 'default_user'):
    return {"trades": db.get_trade_history(user_id)}

@app.get("/api/behavioral-profile")
def get_behavioral_profile(user_id: str = 'default_user'):
    trades = db.get_trade_history(user_id)
    profile = behavioral_engine.get_full_behavioral_profile(trades)
    return profile

@app.get("/api/market-intelligence/{symbol}")
def get_market_intelligence(symbol: str):
    keys = db.get_api_keys()
    gemini_key = keys.get('gemini_api_key')
    candle_data = db.get_stock_candles(symbol, timeframe='5m', limit=60)
    data = rag_engine.get_market_intelligence(symbol, gemini_api_key=gemini_key, candle_data=candle_data)
    data['fundamentals'] = db.get_stock_fundamentals(symbol)
    return data

@app.get("/api/fundamentals/{symbol}")
def get_fundamentals(symbol: str):
    return {"symbol": symbol, "fundamentals": db.get_stock_fundamentals(symbol)}

@app.get("/api/market-heatmap")
def get_market_heatmap():
    return {"sectors": rag_engine.get_market_heatmap()}

@app.get("/api/keys")
def get_keys():
    return {"keys": db.get_api_keys()}

@app.post("/api/keys")
def save_keys(payload: ApiKeysPayload):
    data = payload.dict()
    for k, v in data.items():
        if v is not None:
            db.save_api_key(k, v)
    return {"status": "SUCCESS", "message": "API Keys saved successfully to SQLite database."}

@app.post("/api/demo-seed")
def seed_demo_data(user_id: str = 'default_user'):
    # Ensure portfolio exists
    db.get_portfolio(user_id)
    
    db.sqlite_conn.cursor().execute("DELETE FROM trades WHERE user_id = ?", (user_id,))
    
    demo_trades = [
        ('HDFCBANK', 'BUY', 50, 1520.0, -3200.0, 15),
        ('HDFCBANK', 'BUY', 60, 1515.0, -2800.0, 18),
        ('ICICIBANK', 'BUY', 40, 1050.0, -2500.0, 12),
        ('RELIANCE', 'BUY', 20, 2450.0, +4100.0, 45),
        ('TCS', 'BUY', 15, 3800.0, +3200.0, 60),
    ]

    total_demo_pnl = sum([t[4] for t in demo_trades])
    cash_after_demo = 100000.0 + total_demo_pnl

    db.sqlite_conn.cursor().execute("UPDATE portfolio SET cash_balance = ?, initial_balance = 100000.0 WHERE user_id = ?", (cash_after_demo, user_id))
    db.sqlite_conn.commit()

    for i, (sym, side, qty, px, pnl, hold) in enumerate(demo_trades, 1):
        code = f"T-{user_id[:8]}-{i:02d}"
        exit_px = round(px + (pnl / qty), 2)
        db.sqlite_conn.cursor().execute("""
            INSERT INTO trades (trade_code, user_id, symbol, side, quantity, price, exit_price, total_value, timestamp, sentiment_tag, status, pnl, holding_time_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now', ?), 'Bearish Volatility', 'CLOSED', ?, ?)
        """, (code, user_id, sym, side, qty, px, exit_px, qty * px, f"-{120 - i*15} minutes", pnl, hold))

    db.sqlite_conn.commit()

    return {
        "status": "SUCCESS",
        "message": "Pre-loaded 5 historical trades. Next trade will trigger behavioral activation & XAI Receipt live!",
        "trades": db.get_trade_history(user_id)
    }

@app.post("/api/strategy/backtest")
def run_strategy_backtest(req: StrategyBacktestRequest):
    import numpy as np
    import pandas as pd
    data = db.get_stock_candles(req.symbol, timeframe=req.timeframe or '5m', limit=200)
    candles = data.get('candles', [])
    if len(candles) < 20:
        raise HTTPException(status_code=400, detail="Insufficient candle data for strategy backtest")
    
    initial_balance = 100000.0
    balance = initial_balance
    position = None
    trades = []
    equity_curve = [initial_balance]
    
    tp_pct = req.take_profit_pct or 3.0
    sl_pct = req.stop_loss_pct or 1.5
    strat = req.strategy or "RSI_MEAN_REVERSION"

    for i in range(5, len(candles)):
        c = candles[i]
        price = float(c['close'])
        rsi = float(c.get('rsi', 50.0))
        sma20 = float(c.get('sma_20', price))
        ema9 = float(c.get('ema_9', price))
        
        prev_c = candles[i-1]
        prev_price = float(prev_c['close'])
        prev_sma20 = float(prev_c.get('sma_20', prev_price))
        prev_ema9 = float(prev_c.get('ema_9', prev_price))
        
        signal = False
        if strat == "RSI_MEAN_REVERSION" and rsi < 42 and position is None:
            signal = True
        elif strat == "SMA_BREAKOUT" and price > sma20 and prev_price <= prev_sma20 and position is None:
            signal = True
        elif strat == "EMA_CROSSOVER" and ema9 > sma20 and prev_ema9 <= prev_sma20 and position is None:
            signal = True
            
        if signal:
            qty = max(1, int((balance * 0.20) / price))
            position = {'entry_price': price, 'qty': qty, 'entry_index': i}
        elif position is not None:
            entry_p = position['entry_price']
            pct_change = ((price - entry_p) / entry_p) * 100.0
            
            if pct_change >= tp_pct or pct_change <= -sl_pct or (strat == "RSI_MEAN_REVERSION" and rsi > 62):
                pnl = (price - entry_p) * position['qty']
                balance += pnl
                trades.append({
                    'entry_price': round(entry_p, 2),
                    'exit_price': round(price, 2),
                    'pnl': round(pnl, 2),
                    'pnl_pct': round(pct_change, 2),
                    'win': pnl > 0
                })
                position = None
                
        equity_curve.append(round(balance, 2))
        
    wins = [t for t in trades if t['win']]
    win_rate = round((len(wins) / max(len(trades), 1)) * 100.0, 1)
    total_return_pct = round(((balance - initial_balance) / initial_balance) * 100.0, 2)
    
    s_eq = pd.Series(equity_curve)
    peaks = s_eq.cummax()
    drawdowns = (s_eq - peaks) / (peaks + 1e-9)
    max_drawdown_pct = round(abs(float(drawdowns.min())) * 100.0, 2)
    
    return {
        'symbol': req.symbol.upper(),
        'strategy': strat,
        'timeframe': req.timeframe,
        'total_trades': len(trades),
        'win_rate_pct': win_rate,
        'total_return_pct': total_return_pct,
        'max_drawdown_pct': max_drawdown_pct,
        'final_balance': round(balance, 2),
        'equity_curve': equity_curve[-25:],
        'recent_simulated_trades': trades[-5:]
    }

@app.post("/api/trade/post-mortem")
def get_trade_post_mortem(req: PostMortemRequest):
    t = db.get_trade_by_code(req.trade_code)
    if not t:
        raise HTTPException(status_code=404, detail=f"Trade {req.trade_code} not found")
        
    symbol = t.get('symbol')
    side = t.get('side')
    qty = int(t.get('quantity', 1))
    entry_price = float(t.get('price', 100.0))
    status = t.get('status', 'EXECUTED')
    total_val = float(t.get('total_value', qty * entry_price))
    holding_mins = float(t.get('holding_time_minutes', 15.0))
    
    if status == 'EXECUTED':
        live_px = db.get_symbol_live_price(symbol) or entry_price
        exit_price = live_px
        if side == 'BUY':
            pnl = (live_px - entry_price) * qty
        else:
            pnl = (entry_price - live_px) * qty
    else:
        exit_price = float(t.get('exit_price') or entry_price)
        pnl = float(t.get('pnl', (exit_price - entry_price) * qty if side == 'BUY' else (entry_price - exit_price) * qty))

    pnl_pct = (pnl / (total_val + 1e-8)) * 100.0
    
    behavioral_flags = []
    if holding_mins < 5.0 and pnl < 0:
        behavioral_flags.append("Rapid Re-entry Risk (Revenge Trap)")
    if total_val > 50000 and pnl < 0:
        behavioral_flags.append("High Position Capital Risk")
    if pnl > 0 and pnl_pct >= 2.0:
        behavioral_flags.append("High Risk-to-Reward Ratio Achieved")
    if not behavioral_flags:
        behavioral_flags.append("Optimal Risk Boundary Compliance")

    if pnl > 1000 or pnl_pct > 3.0:
        grade = "A+"
        verdict = f"EXCELLENT DISCIPLINED EXECUTION (+{pnl_pct:.1f}%)"
        tip = f"Patience and entry timing were spot on for {symbol}. Maintain this target sizing discipline."
    elif pnl > 0:
        grade = "B+"
        verdict = f"PROFITABLE TRADE (+{pnl_pct:.1f}%)"
        tip = f"Solid gain of ₹{pnl:,.2f}. Lock trailing stop-loss to protect capital."
    elif pnl >= -500 or pnl_pct >= -2.0:
        grade = "C"
        verdict = f"CONTROLLED RISK BOUNDARY ({pnl_pct:.1f}%)"
        tip = f"Loss of ₹{abs(pnl):,.2f} kept within strict stop-loss parameters. Good emotional control."
    else:
        grade = "F"
        verdict = f"EMOTIONAL OVERSIZING / REVENGE TRAP ({pnl_pct:.1f}%)"
        tip = f"Position size (₹{total_val:,.2f}) was too large for market volatility. Avoid re-entering immediately after a loss."

    keys = db.get_api_keys()
    gemini_key = keys.get('gemini_api_key')
    
    ai_insights = None
    if gemini_key:
        try:
            ai_insights = xai_engine.generate_xai_receipt(
                risk_eval={'has_risk': pnl < 0, 'primary_risk_state': 'POST_MORTEM_EVAL', 'flags': [{'title': f, 'description': f} for f in behavioral_flags]},
                user_trades=[t],
                pending_trade={'symbol': symbol, 'side': side, 'quantity': qty, 'price': entry_price},
                gemini_api_key=gemini_key
            )
        except Exception as e:
            print(f"[PostMortem] Gemini AI receipt fallback: {e}")

    return {
        'trade_code': req.trade_code,
        'symbol': symbol,
        'side': side,
        'quantity': qty,
        'entry_price': round(entry_price, 2),
        'exit_price': round(exit_price, 2),
        'total_value': round(total_val, 2),
        'pnl': round(pnl, 2),
        'pnl_pct': round(pnl_pct, 2),
        'grade': grade,
        'verdict': verdict,
        'tip': tip,
        'holding_time_mins': round(holding_mins, 1),
        'behavioral_flags': behavioral_flags,
        'ai_insights': ai_insights,
        'status': status
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
