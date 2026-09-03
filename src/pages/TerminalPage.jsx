import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrendingUp, 
  TrendingDown, 
  Activity,
  Cpu
} from 'lucide-react';
import { StockSelector } from '../components/StockSelector';

export const TerminalPage = () => {
  const { 
    selectedStock, 
    setSelectedStock, 
    timeframe, 
    setTimeframe, 
    stockList, 
    candles, 
    currentQuote, 
    loadingCandles,
    handleEvaluateAndOrder,
    trades,
    closeTrade,
    portfolio
  } = useTrading();

  const [orderSide, setOrderSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(25);
  const [limitPrice, setLimitPrice] = useState('');
  const [sentimentTag, setSentimentTag] = useState('Bearish Volatility');
  const [selectedIndicator, setSelectedIndicator] = useState('OFF');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { userId, user, isAuthenticated, setIsAuthModalOpen } = useAuth();
  const [orderMsg, setOrderMsg] = useState(null);

  const activePrice = currentQuote.price || 1500.0;
  const execPrice = orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : activePrice;
  const totalValue = quantity * execPrice;
  const cashAvailable = portfolio?.cash_balance || 0;
  const riskReward = stopLoss && takeProfit && (execPrice - stopLoss) !== 0 ? Math.abs((takeProfit - execPrice) / (execPrice - stopLoss)).toFixed(1) : 'N/A';

  const activePositions = trades.filter(t => t.status === 'EXECUTED');

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
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null
    };

    const res = await handleEvaluateAndOrder(orderParams);
    setSubmitting(false);

    if (res?.success) {
      setOrderMsg({ type: 'success', text: `EXECUTED: ${orderSide} ${quantity} ${selectedStock}` });
      setTimeout(() => setOrderMsg(null), 3000);
    } else {
      setOrderMsg({ type: 'error', text: res?.error || 'Order execution failed.' });
      setTimeout(() => setOrderMsg(null), 4000);
    }
  };

  // Professional Crosshair Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#000000] border border-gray-800 p-2 shadow-2xl">
          <p className="text-[10px] text-gray-500 font-mono mb-1.5 uppercase tracking-widest">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-6 text-[11px] font-mono">
                <span style={{ color: entry.color }} className="font-medium">{entry.name.toUpperCase()}</span>
                <span className="text-white font-bold">
                  {entry.name === 'Volume' 
                    ? entry.value.toLocaleString()
                    : `₹${parseFloat(entry.value).toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[calc(100vh-60px)] bg-[#000000] text-gray-300 font-sans flex flex-col overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* ─── 1. ASSET HEADER (Top Command Rail) ─── */}
      <header className="flex-none h-16 border-b border-gray-900 bg-[#000000] flex items-center justify-between px-6 z-20">
        
        {/* Ticker Search & Identity */}
        <StockSelector />

        {/* Live Metrics */}
        <div className="flex items-center h-full">
          <div className="flex flex-col justify-center px-8 border-l border-gray-900 h-full">
            <span className="text-[22px] font-mono font-medium text-white tracking-tight leading-none">
              ₹{activePrice.toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col justify-center px-8 border-l border-gray-900 h-full">
            {(() => {
              const chg = currentQuote?.change_pct !== undefined && currentQuote?.change_pct !== null ? Number(currentQuote.change_pct) : 0.0;
              const isPos = chg >= 0;
              return (
                <div className={`flex items-center gap-1.5 font-mono text-sm tracking-tight ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span>{isPos ? '+' : ''}{chg.toFixed(2)}%</span>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center justify-center px-6 border-l border-gray-900 h-full">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>

      </header>

      {/* ─── Main Workstation Layout ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Subtle Ambient Depth Layer (Behind everything) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] opacity-20" />
        </div>

        {/* ─── LEFT: Chart & Ledger ─── */}
        <div className="flex-1 flex flex-col border-r border-gray-900 z-10 relative bg-[#000000]">
          
          {/* Chart Header Controls */}
          <div className="flex-none h-10 border-b border-gray-900 flex items-center justify-between px-4">
            <div className="flex items-center gap-6 h-full">
              {/* Timeframes */}
              <div className="flex items-center h-full gap-1">
                {['1m', '5m', '15m', '1h', '1d'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`h-full px-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-b-2 ${
                      timeframe === tf
                        ? 'text-cyan-400 border-cyan-500'
                        : 'text-gray-600 border-transparent hover:text-gray-400'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              
              <div className="w-[1px] h-4 bg-gray-900" />

              {/* Indicators */}
              <div className="flex items-center h-full gap-4">
                {[
                  { id: 'SMA', label: 'SMA 20' },
                  { id: 'EMA', label: 'EMA 9' },
                  { id: 'RSI', label: 'RSI 14' },
                  { id: 'OFF', label: 'PRICE ONLY' }
                ].map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndicator(ind.id)}
                    className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
                      selectedIndicator === ind.id
                        ? 'text-white'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingCandles && (
              <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Syncing Data...
              </span>
            )}
          </div>

          {/* Chart Canvas (Edge-to-Edge) */}
          <div className="flex-1 min-h-[300px] w-full bg-[#000000]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candles} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 0" stroke="#0f172a" vertical={true} horizontal={true} />
                <XAxis dataKey="time" stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={10} />
                <YAxis domain={['auto', 'auto']} stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} orientation="right" dx={10} />
                <YAxis yAxisId={1} orientation="left" domain={[0, 'dataMax * 5']} hide />
                
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} 
                  isAnimationActive={false}
                />
                
                <Area type="monotone" dataKey="close" stroke="#22d3ee" strokeWidth={1} fill="url(#chartFill)" name="Close" isAnimationActive={false} />
                
                {selectedIndicator === 'SMA' && (
                  <Line type="monotone" dataKey="sma_20" stroke="#34d399" strokeWidth={1} dot={false} name="SMA 20" isAnimationActive={false} />
                )}
                {selectedIndicator === 'EMA' && (
                  <Line type="monotone" dataKey="ema_9" stroke="#fbbf24" strokeWidth={1} dot={false} name="EMA 9" isAnimationActive={false} />
                )}
                
                {selectedIndicator !== 'OFF' && (
                  <Bar dataKey="volume" yAxisId={1} fill="#1e293b" opacity={0.6} name="Volume" isAnimationActive={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* RSI Sub-Panel */}
          {selectedIndicator === 'RSI' && (
            <div className="h-[120px] w-full border-t border-gray-900 bg-[#000000]">
              <div className="flex items-center justify-between px-4 py-1.5 text-[9px] font-mono text-gray-500 uppercase tracking-widest border-b border-gray-900">
                <span className="text-purple-400">RSI (14) Momentum</span>
                <span>OVS &lt; 30 | OVB &gt; 70</span>
              </div>
              <div className="h-[calc(100%-25px)] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={candles} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="#0f172a" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} ticks={[30, 70]} stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} orientation="right" dx={10} />
                    <Line type="monotone" dataKey="rsi" stroke="#c084fc" strokeWidth={1} dot={false} name="RSI" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ─── BOTTOM: Position Ledger ─── */}
          <div className="h-[240px] flex-none border-t border-gray-900 bg-[#000000] flex flex-col">
            <div className="flex-none h-8 border-b border-gray-900 flex items-center px-4 bg-[#02040a]">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Position Ledger</span>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar">
              {activePositions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mb-1">No Active Positions</span>
                  <span className="text-[11px] font-sans text-gray-600">Your execution workspace is ready. Execute a paper order to begin tracking.</span>
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="sticky top-0 bg-[#02040a] text-gray-600 text-[9px] uppercase tracking-widest z-10 border-b border-gray-900 shadow-sm">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Code</th>
                      <th className="py-2.5 px-4 font-normal">Symbol</th>
                      <th className="py-2.5 px-4 font-normal">Side</th>
                      <th className="py-2.5 px-4 font-normal text-right">Qty</th>
                      <th className="py-2.5 px-4 font-normal text-right">Entry</th>
                      <th className="py-2.5 px-4 font-normal text-right">Current</th>
                      <th className="py-2.5 px-4 font-normal text-right">P&L</th>
                      <th className="py-2.5 px-4 font-normal text-center">Risk</th>
                      <th className="py-2.5 px-4 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {activePositions.map((t) => {
                      const entryPx = parseFloat(t.price || 0);
                      const qty = parseFloat(t.quantity || 0);
                      let livePx = entryPx;
                      const tSym = String(t.symbol || '').toUpperCase().trim();
                      const qSym = String(currentQuote?.symbol || '').toUpperCase().trim();
                      
                      if (tSym === qSym && currentQuote?.price && parseFloat(currentQuote.price) > 0) {
                        livePx = parseFloat(currentQuote.price);
                      } else if (stockList && stockList.length > 0) {
                        const found = stockList.find(s => String(s.symbol || '').toUpperCase().trim() === tSym);
                        if (found && found.price && parseFloat(found.price) > 0) {
                          livePx = parseFloat(found.price);
                        }
                      }
                      
                      const pnl = t.side === 'BUY' ? (livePx - entryPx) * qty : (entryPx - livePx) * qty;
                      const totalVal = entryPx * qty;
                      const pnlPct = totalVal > 0 ? (pnl / totalVal) * 100 : 0;
                      
                      const slVal = t.stop_loss !== null && t.stop_loss !== undefined ? parseFloat(t.stop_loss) : null;
                      const tpVal = t.take_profit !== null && t.take_profit !== undefined ? parseFloat(t.take_profit) : null;

                      return (
                        <tr key={t.trade_code} className="hover:bg-[#050811] transition-colors group">
                          <td className="py-3 px-4 text-gray-500">{t.trade_code}</td>
                          <td className="py-3 px-4 font-medium text-white">{t.symbol}</td>
                          <td className="py-3 px-4">
                            <span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.side}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-300">{t.quantity}</td>
                          <td className="py-3 px-4 text-right text-gray-400">₹{entryPx.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-white">₹{livePx.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-medium tracking-tight ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toFixed(2)}
                            <span className="text-[9px] opacity-60 ml-1">({pnlPct.toFixed(2)}%)</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-[9px]">
                              {slVal ? <span className="text-rose-400/80">SL:{slVal.toFixed(1)}</span> : <span className="text-gray-700">-</span>}
                              {tpVal ? <span className="text-emerald-400/80">TP:{tpVal.toFixed(1)}</span> : <span className="text-gray-700">-</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => closeTrade(t.trade_code, livePx)}
                              className="text-[9px] uppercase tracking-widest text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                              SQUARE OFF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Execution Cockpit ─── */}
        <div className="w-full lg:w-[320px] flex-none flex flex-col bg-[#000000] z-20 relative">
          
          <div className="flex-none h-10 border-b border-gray-900 flex items-center px-6 bg-[#000000]">
            <span className="text-[10px] font-mono text-white uppercase tracking-widest">Execution Console</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col">
            
            {/* 1. SIDE */}
            <div className="mb-8">
              <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-3">Side</label>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => setOrderSide('BUY')}
                  className={`flex-1 py-2 text-[11px] font-mono font-medium uppercase tracking-widest border-t border-b border-l border-gray-900 transition-colors ${
                    orderSide === 'BUY'
                      ? 'text-emerald-400 bg-emerald-950/10 border-t-emerald-500'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('SELL')}
                  className={`flex-1 py-2 text-[11px] font-mono font-medium uppercase tracking-widest border-t border-b border-r border-gray-900 border-l border-l-gray-900 transition-colors ${
                    orderSide === 'SELL'
                      ? 'text-rose-400 bg-rose-950/10 border-t-rose-500'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitOrder} className="flex-1 flex flex-col">
              
              <div className="space-y-6 flex-1">
                
                {/* QUANTITY */}
                <div className="relative group">
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Quantity (Shares)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-800 text-lg text-white font-mono py-1 outline-none focus:border-cyan-500 transition-colors"
                    required
                  />
                </div>

                {/* ORDER TYPE */}
                <div className="relative group">
                  <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Order Type</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-800 text-sm text-gray-300 font-mono py-1.5 outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="MARKET" className="bg-[#02040a]">MARKET</option>
                    <option value="LIMIT" className="bg-[#02040a]">LIMIT</option>
                  </select>
                </div>

                {/* LIMIT PRICE */}
                <AnimatePresence>
                  {orderType === 'LIMIT' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative group"
                    >
                      <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Limit Price (₹)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={activePrice.toFixed(2)}
                        className="w-full bg-transparent border-b border-gray-800 text-lg text-white font-mono py-1 outline-none focus:border-cyan-500 transition-colors"
                        required
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RISK MANAGEMENT */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-900/50">
                  <div className="relative group">
                    <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Stop Loss</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Opt"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 text-sm text-rose-400 font-mono py-1 outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Take Profit</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Opt"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 text-sm text-emerald-400 font-mono py-1 outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* AI CONTEXT (Native Block) */}
                <div className="pt-6">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Cpu className="h-3 w-3 text-cyan-500" />
                    <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest">FinAI Signal</span>
                  </div>
                  <select
                    value={sentimentTag}
                    onChange={(e) => setSentimentTag(e.target.value)}
                    className="w-full bg-transparent border-l-2 border-cyan-500 pl-3 text-[11px] text-gray-300 font-mono py-1 outline-none appearance-none cursor-pointer"
                  >
                    <option value="Bearish Volatility" className="bg-[#02040a]">Bearish Volatility</option>
                    <option value="Bullish" className="bg-[#02040a]">Bullish</option>
                    <option value="Neutral" className="bg-[#02040a]">Neutral</option>
                  </select>
                </div>

              </div>

              {/* EXECUTION SUMMARY */}
              <div className="mt-8 space-y-3 font-mono">
                <div className="flex justify-between items-end text-[10px]">
                  <span className="text-gray-500 uppercase tracking-widest">Execution Price</span>
                  <span className="text-gray-300">₹{execPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end text-[10px]">
                  <span className="text-gray-500 uppercase tracking-widest">Available Cash</span>
                  <span className="text-emerald-400">₹{cashAvailable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-end text-[10px]">
                  <span className="text-gray-500 uppercase tracking-widest">Risk / Reward</span>
                  <span className="text-gray-400">1 : {riskReward}</span>
                </div>
                
                <div className="flex justify-between items-end pt-4 border-t border-gray-900">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">Capital Required</span>
                  <span className="text-[16px] font-medium text-white tracking-tight">
                    ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* EXECUTE BUTTON */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full mt-8 h-12 text-[11px] font-mono font-medium uppercase tracking-widest transition-all ${
                  orderSide === 'BUY'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-rose-500 hover:bg-rose-400 text-black'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'PROCESSING...' : `EXECUTE ${orderSide}`}
              </button>

              <AnimatePresence>
                {orderMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-center text-[9px] font-mono text-emerald-400 uppercase tracking-widest"
                  >
                    {orderMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
