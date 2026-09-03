import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Area
} from 'recharts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  Clock, 
  Zap, 
  ShieldAlert, 
  Check,
  ChevronDown
} from 'lucide-react';

export const TradingTerminal = () => {
  const { 
    selectedStock, 
    setSelectedStock, 
    timeframe, 
    setTimeframe, 
    stockList, 
    candles, 
    currentQuote, 
    marketDataSource,
    loadingCandles,
    handleEvaluateAndOrder,
    coolingOffTimer,
    marketStatus,
    portfolio,
    isDemoMode,
    isTiltMode,
    tiltModeTimeLeft,
    unlockTiltMode
  } = useTrading();

  const [orderSide, setOrderSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [productType, setProductType] = useState('DELIVERY');
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState('');
  const [sentimentTag, setSentimentTag] = useState('Bearish Volatility');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orderMsg, setOrderMsg] = useState(null);

  const { userId, user, isAuthenticated, setIsAuthModalOpen } = useAuth();

  const selectedStockObj = stockList.find(s => s.symbol === selectedStock);
  const activePrice = currentQuote.price || selectedStockObj?.price || (candles?.length > 0 ? candles[candles.length - 1].close : 1500.0);
  const activeChangePct = currentQuote.change_pct !== null && currentQuote.change_pct !== undefined ? currentQuote.change_pct : (selectedStockObj?.change_pct || 0.0);
  const execPrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : (activePrice || 1500.0);
  const totalValue = quantity * execPrice;
  const maxAffordableQty = Math.max(1, Math.floor((portfolio?.cash_balance || 100000.0) / (execPrice || 1)));

  const filteredStocks = stockList.filter(s => 
    (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setOrderMsg(null);

    if (!isAuthenticated) {
      setSubmitting(false);
      setIsAuthModalOpen(true);
      setOrderMsg({
        type: 'info',
        text: 'Please Sign In or Create an Account to execute live paper trades & track your portfolio.'
      });
      return;
    }

    const orderParams = {
      user_id: userId || user?.user_id || 'usr_guest',
      symbol: selectedStock,
      side: orderSide,
      quantity: parseInt(quantity),
      price: execPrice,
      sentiment_tag: sentimentTag,
      product_type: productType,
      order_type: orderType
    };

    const res = await handleEvaluateAndOrder(orderParams);
    setSubmitting(false);

    if (res?.success) {
      if (res.is_amo) {
        setOrderMsg({ 
          type: 'amo', 
          text: res.message || `After Market Order (AMO) queued for 09:15 AM IST market open!` 
        });
      } else {
        setOrderMsg({ 
          type: 'success', 
          text: `Paper Trade Executed! (${productType} ${orderSide}) ${quantity} ${selectedStock} @ ₹${Number(execPrice).toFixed(2)}` 
        });
      }
    } else if (res?.risk_flagged) {
      setOrderMsg({
        type: 'info',
        text: 'AI Risk Engine flagged behavioral risk. Please review the XAI Modal to proceed.'
      });
    } else {
      setOrderMsg({
        type: 'error',
        text: res?.error || res?.message || 'Failed to place order. Check cash balance or market status.'
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {isDemoMode && (
        <div className="w-full bg-[var(--finai-amber)]/10 border border-[var(--finai-amber)]/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--finai-amber)] animate-pulse shadow-[0_0_8px_rgba(255,170,0,0.6)]" />
            <span className="text-xs font-mono font-bold tracking-widest text-[var(--finai-amber)] uppercase">DEMO MODE | PAPER TRADING</span>
          </div>
          <span className="text-xs font-mono text-[var(--finai-amber)]">Simulated execution with fake capital. Trades will not reach the real market.</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Columns: Chart & Ticker Header */}
        <div className="lg:col-span-8 space-y-4">
        
        {/* Ticker Search & Timeframe Controls */}
        <div className="fin-card p-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Stock Search Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 bg-slate-900 border border-slate-700/80 hover:border-cyan-500/60 px-4 py-2 rounded-xl transition-all"
            >
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-extrabold text-base text-slate-100">{selectedStock}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded">NSE</span>
                </div>
                <div className="text-xs text-slate-400">
                  {stockList.find(s => s.symbol === selectedStock)?.name || 'Equity Ticker'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Indian equities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => {
                        setSelectedStock(stock.symbol);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-slate-200">{stock.symbol}</div>
                        <div className="text-[10px] text-slate-400">{stock.name}</div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{stock.sector}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Header */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Live Indian Quote · {marketDataSource?.replace('_', ' ') || 'broker api'}
              </div>
              <div className="font-mono text-2xl font-extrabold text-slate-100">
                ₹{activePrice.toFixed(2)}
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
              activeChangePct >= 0 ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
            }`}>
              {activeChangePct >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              <span>{activeChangePct >= 0 ? '+' : ''}{activeChangePct.toFixed(2)}%</span>
            </div>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 border border-slate-800 rounded-xl">
            {['1m', '5m', '15m', '1h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

        </div>

        {/* Main Chart Area */}
        <div className="fin-card p-5 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-400">
              <span className="text-slate-200">{selectedStock} ({timeframe.toUpperCase()})</span>
              <span className="text-emerald-400">• SMA (20)</span>
              <span className="text-cyan-400">• EMA (9)</span>
              <span className="text-purple-400">• RSI (14)</span>
            </div>
            {loadingCandles && (
              <span className="text-xs text-cyan-400 animate-pulse font-mono">Loading broker/local intraday candles...</span>
            )}
          </div>

          {/* Candlestick / Price Composed Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 10 }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="close" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorClose)" />
                <Line type="monotone" dataKey="sma_20" stroke="#10b981" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="ema_9" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                <Bar dataKey="volume" yAxisId={1} fill="#334155" opacity={0.4} />
                <YAxis yAxisId={1} orientation="right" domain={[0, 'dataMax * 4']} hide />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sub-Chart: Technical Indicators (RSI & MACD) */}
          <div className="h-24 w-full mt-4 pt-3 border-t border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 mb-1">RSI (14) Indicator</div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candles} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} ticks={[30, 50, 70]} stroke="#475569" tick={{ fontSize: 9 }} />
                <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {/* Right 4 Columns: Order Ticket Form */}
      <div className="lg:col-span-4">
        <div className="fin-card p-5 space-y-4 sticky top-20">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>NSE Order Ticket</span>
            </h3>
            <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
              marketStatus?.is_open 
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' 
                : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
            }`}>
              {marketStatus?.is_open ? '● LIVE MARKET' : 'AMO QUEUED (09:15 AM OPEN)'}
            </span>
          </div>

          {/* Product Type Selector (DELIVERY vs INTRADAY) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Product Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setProductType('DELIVERY')}
                className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                  productType === 'DELIVERY'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DELIVERY (CNC)
              </button>
              <button
                type="button"
                onClick={() => setProductType('INTRADAY')}
                className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                  productType === 'INTRADAY'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                INTRADAY (MIS)
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 px-1">
              {productType === 'INTRADAY' 
                ? 'Auto square-off by broker at 15:20 PM IST end of day' 
                : 'Hold in portfolio long-term with 100% cash backing'}
            </div>
          </div>

          {/* Order Side Selector (BUY / SELL) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setOrderSide('BUY')}
              className={`py-2 rounded-lg font-bold text-xs transition-all ${
                orderSide === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => setOrderSide('SELL')}
              className={`py-2 rounded-lg font-bold text-xs transition-all ${
                orderSide === 'SELL'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SELL / SHORT
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            
            {/* Quantity Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Order Quantity (Shares)
                </label>
                <button
                  type="button"
                  onClick={() => setQuantity(maxAffordableQty)}
                  className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 underline"
                >
                  Auto-Fit ({maxAffordableQty} Max)
                </button>
              </div>
              <input
                type="number"
                min="1"
                max="5000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 font-mono font-bold text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Order Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Order Type</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
                >
                  <option value="MARKET">MARKET</option>
                  <option value="LIMIT">LIMIT</option>
                  <option value="AMO">AMO (AFTER MARKET)</option>
                </select>
              </div>

              {/* Sentiment Tag dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sentiment Tag</label>
                <select
                  value={sentimentTag}
                  onChange={(e) => setSentimentTag(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500"
                >
                  <option value="Bearish Volatility">Bearish Volatility</option>
                  <option value="Bullish">Bullish</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
            </div>

            {orderType === 'LIMIT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Limit Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder={`Current: ${activePrice}`}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 font-mono text-sm px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            )}

            {/* Rupee Total Calculation Card */}
            <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Est. Price / Share</span>
                <span className="font-mono text-slate-200">₹{execPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Product Mode</span>
                <span className="font-mono font-bold text-amber-400">{productType} ({productType === 'INTRADAY' ? 'MIS' : 'CNC'})</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Available Cash</span>
                <span className="font-mono text-slate-300">₹{(portfolio?.cash_balance || 100000.0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-800">
                <span className="text-slate-200">Total Capital Req.</span>
                <span className={`font-mono ${totalValue > (portfolio?.cash_balance || 100000.0) ? 'text-rose-400 font-extrabold' : 'text-cyan-400'}`}>
                  ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Insufficient Cash Warning Banner */}
            {totalValue > (portfolio?.cash_balance || 100000.0) && (
              <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start justify-between">
                <div>
                  <div className="font-bold">Insufficient Cash Balance</div>
                  <div className="text-[11px] text-rose-200/80 mt-0.5">
                    Order total (₹{totalValue.toLocaleString('en-IN')}) exceeds cash balance (₹{(portfolio?.cash_balance || 100000.0).toLocaleString('en-IN')}).
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(maxAffordableQty)}
                  className="ml-2 px-2 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 text-[10px] font-mono font-bold rounded shrink-0"
                >
                  Set to {maxAffordableQty}
                </button>
              </div>
            )}

            {/* Cooling-off Notice Banner */}
            {coolingOffTimer !== null && coolingOffTimer > 0 && (
              <div className="p-3 bg-amber-950/60 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Cooling-Off Pause Active</div>
                  <div className="text-[11px] text-amber-200/80">
                    AI recommendation active. Placing trades during cooling off degrades your discipline score.
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button or Tilt Mode Lock */}
            {isTiltMode ? (
              <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl space-y-4 animate-pulse-slow">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                  <div>
                    <h4 className="text-rose-400 font-bold text-sm">TILT MODE ACTIVATED</h4>
                    <p className="text-xs text-rose-200 mt-1 leading-relaxed">
                      FinAI has detected impulsive revenge trading (3+ consecutive losses with increased position sizing). Your terminal is locked to protect your capital.
                    </p>
                    <div className="mt-3 font-mono text-xl font-bold text-rose-300">
                      {Math.floor(tiltModeTimeLeft / 60)}:{(tiltModeTimeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={unlockTiltMode}
                  className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 text-cyan-400 text-xs font-bold rounded-lg transition-colors"
                >
                  I've completed my breathing exercise. Unlock Terminal.
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
                  orderSide === 'BUY'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/20'
                }`}
              >
                {submitting ? 'Evaluating AI Risk Engine...' : (!marketStatus?.is_open || orderType === 'AMO' ? `Queue ${productType} ${orderSide} (AMO)` : `Execute ${productType} ${orderSide} Order`)}
              </button>
            )}

            {orderMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                orderMsg.type === 'error'
                  ? 'bg-rose-950/90 border-rose-800 text-rose-300'
                  : orderMsg.type === 'info'
                  ? 'bg-cyan-950/90 border-cyan-800 text-cyan-300'
                  : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              }`}>
                <Check className="h-4 w-4 shrink-0" />
                <span>{orderMsg.text}</span>
              </div>
            )}

          </form>
        </div>
      </div>

    </div>
    </div>
  );
};
