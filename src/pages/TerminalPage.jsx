import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  Star, MoreHorizontal, Maximize2, Minimize,
  Minus, Plus, Info, TrendingUp, TrendingDown, Clock, Activity, BarChart3, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TerminalPage = () => {
  const { 
    selectedStock, 
    setSelectedStock,
    timeframe, 
    setTimeframe, 
    candles, 
    currentQuote, 
    handleEvaluateAndOrder,
    trades,
    portfolio,
    closeTrade,
    stockList,
    watchlist,
    toggleWatchlist
  } = useTrading();

  const { userId, user, isAuthenticated, setIsAuthModalOpen } = useAuth();

  const [orderSide, setOrderSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(25);
  const [submitting, setSubmitting] = useState(false);
  const [activeTradeTab, setActiveTradeTab] = useState('Trade');
  const [bottomTab, setBottomTab] = useState('Positions');
  
  const [fundamentals, setFundamentals] = useState(null);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [isStockSearchOpen, setIsStockSearchOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  useEffect(() => {
      const fetchIntel = async () => {
          try {
              const API_BASE = import.meta.env.VITE_API_URL || "";
              const res = await fetch(`${API_BASE}/api/market-intelligence/${encodeURIComponent(selectedStock)}`);
              if (res.ok) {
                  const data = await res.json();
                  setFundamentals(data.fundamentals || {});
              } else {
                  setFundamentals(null);
              }
          } catch (e) {
              setFundamentals(null);
          }
      };
      fetchIntel();
  }, [selectedStock]);

  const selectedStockObj = stockList?.find(s => s.symbol === selectedStock);
  const activePrice = currentQuote?.price || selectedStockObj?.price || (candles?.length > 0 ? candles[candles.length - 1].close : 1500.0);
  const changePct = currentQuote?.change_pct !== null && currentQuote?.change_pct !== undefined ? currentQuote.change_pct : (selectedStockObj?.change_pct || 0.0);
  const changeAmt = currentQuote?.change_amt || (activePrice * (changePct / 100));
  const totalValue = quantity * activePrice;
  const isPositiveChange = changePct >= 0;

  // Genuine Intraday and Fundamental Metric Resolution
  const quoteOpen = currentQuote?.open || fundamentals?.open || selectedStockObj?.open;
  const quoteHigh = currentQuote?.day_high || currentQuote?.high || fundamentals?.day_high || selectedStockObj?.high || selectedStockObj?.day_high;
  const quoteLow = currentQuote?.day_low || currentQuote?.low || fundamentals?.day_low || selectedStockObj?.low || selectedStockObj?.day_low;
  const quotePrevClose = currentQuote?.prev_close || fundamentals?.prev_close || selectedStockObj?.prev_close || (activePrice - changeAmt);
  const quoteVolume = currentQuote?.volume || fundamentals?.volume || selectedStockObj?.volume;
  const quote52High = currentQuote?.high_52w || fundamentals?.high_52w || selectedStockObj?.high_52w;
  const quote52Low = currentQuote?.low_52w || fundamentals?.low_52w || selectedStockObj?.low_52w;

  const formatVolume = (vol) => {
    if (!vol || isNaN(vol)) return typeof vol === 'string' ? vol : '—';
    const num = Number(vol);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)} K`;
    return String(num);
  };

  const filteredTerminalStocks = stockSearchQuery.trim()
    ? (stockList || []).filter(s =>
        (s.symbol || '').toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
        (s.name || '').toLowerCase().includes(stockSearchQuery.toLowerCase())
      )
    : (stockList || []);

  const activePositions = trades?.filter(t => t.status === 'EXECUTED') || [];

  const handleOrder = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSubmitting(true);
    const orderParams = {
      user_id: userId || user?.user_id || 'usr_guest',
      symbol: selectedStock || 'ADANIENT',
      side: orderSide,
      quantity: parseInt(quantity),
      price: activePrice,
      sentiment_tag: 'Neutral',
      order_type: orderType,
    };
    const res = await handleEvaluateAndOrder(orderParams);
    if (res && res.success === false && res.error) {
      alert(`Trade failed: ${res.error}`);
    } else if (res && res.success) {
      alert(`Trade executed successfully!`);
    }
    setSubmitting(false);
  };

  const getPositionLivePrice = (pos) => {
    const sym = String(pos.symbol || '').toUpperCase().trim();
    if (sym === String(selectedStock).toUpperCase().trim() && activePrice) return activePrice;
    const s = stockList?.find(item => item.symbol === sym);
    if (s && s.price) return s.price;
    return parseFloat(pos.price || 0);
  };

  // Calculations for Today's Performance
  const todayPnL = activePositions.reduce((acc, t) => {
    const entryPx = parseFloat(t.price || 0);
    const qty = parseFloat(t.quantity || 0);
    const livePx = getPositionLivePrice(t);
    const pnl = t.side === 'BUY' ? (livePx - entryPx) * qty : (entryPx - livePx) * qty;
    return acc + pnl;
  }, 0);
  const todayReturn = portfolio?.total_value > 0 ? (todayPnL / portfolio.total_value) * 100 : 0;
  
  const cash = portfolio?.cash_balance || 100000;
  const totalVal = portfolio?.total_value || 100000;
  const usedMargin = totalVal - cash;
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B0E14] border border-[#1C212D] p-2 text-white shadow-xl rounded">
           <p className="text-[10px] text-gray-500 font-mono mb-1.5 uppercase tracking-widest">{label}</p>
           <p className="text-[11px] font-mono font-bold text-[#00E6A8]">Close: ₹{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const TIMEFRAMES = [
    { id: '1m', label: '1M' },
    { id: '5m', label: '5M' },
    { id: '15m', label: '15M' },
    { id: '1h', label: '1H' },
    { id: '1d', label: '1D' }
  ];

  return (
    <div className="min-h-full flex flex-col gap-5 p-6">
        
        {/* HEADER ASSET BAR */}
        <div className="flex items-center justify-between bg-[#131722] rounded-2xl p-5 border border-[#1C212D] shrink-0 shadow-sm relative">
            <div className="flex items-center gap-5 relative">
                <div className="w-14 h-14 bg-gradient-to-br from-white to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-blue-900 font-black text-sm tracking-tighter uppercase">{selectedStock?.substring(0, 4) || 'NSE'}</span>
                </div>
                <div>
                    <div className="relative">
                        <button 
                            onClick={() => setIsStockSearchOpen(!isStockSearchOpen)}
                            className="flex items-center gap-2.5 group text-left focus:outline-none"
                            title="Click to search and switch stocks"
                        >
                            <h1 className="text-[28px] text-white font-bold tracking-tight leading-none group-hover:text-[#00E6A8] transition-colors">
                                {selectedStock || 'ADANIENT'}
                            </h1>
                            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-[#00E6A8] transition-colors" />
                        </button>

                        {/* Interactive Stock Search Dropdown */}
                        {isStockSearchOpen && (
                            <div className="absolute left-0 top-full mt-3 w-[380px] md:w-[440px] bg-[#0c101a] border border-[#1C212D] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                                <div className="p-3 border-b border-[#1C212D] bg-[#080b12]">
                                    <input 
                                        type="text" 
                                        placeholder="Search 250+ NSE stocks..."
                                        value={stockSearchQuery}
                                        onChange={(e) => setStockSearchQuery(e.target.value)}
                                        className="w-full bg-[#131722] border border-gray-800 text-sm text-white px-3.5 py-2.5 rounded-lg outline-none font-medium placeholder:text-gray-600 focus:border-[#00E6A8]"
                                        autoFocus
                                    />
                                </div>
                                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                    {filteredTerminalStocks.map((s) => {
                                        const px = Number(s.price || 0);
                                        const chg = Number(s.change_pct || 0);
                                        const isPos = chg >= 0;
                                        return (
                                            <button
                                                key={s.symbol}
                                                onClick={() => {
                                                    setSelectedStock(s.symbol);
                                                    setIsStockSearchOpen(false);
                                                    setStockSearchQuery('');
                                                }}
                                                className={`w-full text-left px-4 py-3 hover:bg-[#151c2c] flex items-center justify-between border-b border-gray-900/60 last:border-0 transition-colors ${s.symbol === selectedStock ? 'bg-[#00E6A8]/10' : ''}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`font-mono font-bold text-sm ${s.symbol === selectedStock ? 'text-[#00E6A8]' : 'text-white'}`}>
                                                        {s.symbol}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
                                                        {s.name || 'NSE Equity'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-mono font-bold text-sm text-white">
                                                        ₹{px.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className={`text-[11px] font-mono font-bold ${isPos ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                                                        {isPos ? '+' : ''}{chg.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {filteredTerminalStocks.length === 0 && (
                                        <div className="p-6 text-center text-xs text-gray-500">No stocks matching query</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-400 font-medium tracking-wide">NSE • EQ</span>
                        <span className="text-xs text-gray-500 truncate max-w-[220px]">{selectedStockObj?.name || 'Equity'}</span>
                        <div className="flex items-center gap-2 ml-2">
                            <span className="px-2.5 py-0.5 bg-[#1C212D] text-[#00E6A8] text-[10px] rounded-full font-medium tracking-wide border border-[#00E6A8]/30">Live Price Feed</span>
                            <span className="px-2.5 py-0.5 bg-[#1C212D] text-gray-400 text-[10px] rounded-full font-medium tracking-wide">Real-time</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                    <span className="text-3xl text-white font-bold tracking-tight">₹{activePrice.toFixed(2)}</span>
                    <div className={`flex items-center gap-1.5 mt-1 font-medium ${isPositiveChange ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                        {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm">{isPositiveChange ? '+' : ''}{changeAmt.toFixed(2)} ({isPositiveChange ? '+' : ''}{changePct.toFixed(2)}%)</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => toggleWatchlist(selectedStock)}
                        className="p-3 bg-[#1C212D] rounded-xl hover:bg-gray-800 transition-colors border border-gray-800"
                    >
                        <Star className={`w-5 h-5 ${watchlist.includes(selectedStock) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                    </button>
                    <button className="p-3 bg-[#1C212D] rounded-xl hover:bg-gray-800 transition-colors border border-gray-800">
                        <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
        
        {/* MAIN PANELS ROW */}
        <div className="flex gap-5 flex-1 min-h-[550px]">
            
            {/* LEFT CHART AREA */}
            <div className={isChartExpanded ? 'fixed inset-6 z-50 bg-[#131722] rounded-2xl border border-[#1C212D] flex flex-col shadow-2xl overflow-hidden' : 'flex-1 flex flex-col bg-[#131722] rounded-2xl border border-[#1C212D] overflow-hidden shadow-sm relative'}>
                <div className="flex justify-between items-center p-5 border-b border-[#1C212D]">
                    <div className="flex items-center gap-6">
                        {TIMEFRAMES.map((tf) => (
                            <button 
                              key={tf.id} 
                              onClick={() => setTimeframe(tf.id)}
                              className={`text-[13px] font-medium pb-1 relative uppercase ${timeframe === tf.id ? 'text-[#00E6A8]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {tf.label}
                                {timeframe === tf.id && <div className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-[#00E6A8]"></div>}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <button onClick={() => setIsChartExpanded(!isChartExpanded)} className="p-1.5 hover:bg-[#1C212D] rounded text-gray-400 hover:text-white transition-colors">
                            {isChartExpanded ? <Minimize className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                        <div className="flex items-center gap-2 bg-[#1C212D] px-2.5 py-1 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00E6A8] animate-pulse"></span>
                            <span className="text-[#00E6A8] font-bold text-[10px] tracking-wider uppercase">NSE • LIVE</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 w-full relative pt-4 -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={candles} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00E6A8" stopOpacity={0.15}/>
                            <stop offset="100%" stopColor="#00E6A8" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1C212D" vertical={false} />
                        <XAxis dataKey="time" stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
                        <YAxis domain={['auto', 'auto']} stroke="#334155" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} orientation="right" dx={10} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="close" stroke="#00E6A8" strokeWidth={2} fill="url(#chartFill)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                </div>
                
                {/* Metrics Below Chart */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-t border-[#1C212D] bg-[#0B0E14]/30">
                    {[
                        {l: 'Open', v: quoteOpen ? `₹${parseFloat(quoteOpen).toFixed(2)}` : '—'},
                        {l: 'High', v: quoteHigh ? `₹${parseFloat(quoteHigh).toFixed(2)}` : '—', c: 'text-[#00E6A8]'},
                        {l: 'Low', v: quoteLow ? `₹${parseFloat(quoteLow).toFixed(2)}` : '—', c: 'text-rose-500'},
                        {l: 'Prev Close', v: quotePrevClose ? `₹${parseFloat(quotePrevClose).toFixed(2)}` : '—'},
                        {l: 'Volume', v: formatVolume(quoteVolume)},
                        {l: 'Market Cap', v: fundamentals?.market_cap || selectedStockObj?.market_cap || '—'},
                        {l: 'P/E', v: fundamentals?.pe_ratio || selectedStockObj?.pe_ratio || '—'},
                        {l: '52W High', v: quote52High ? `₹${parseFloat(String(quote52High).replace(/[^0-9.]/g, '')).toFixed(2)}` : '—'},
                        {l: '52W Low', v: quote52Low ? `₹${parseFloat(String(quote52Low).replace(/[^0-9.]/g, '')).toFixed(2)}` : '—'},
                    ].map(m => (
                        <div key={m.l} className="flex flex-col min-w-[60px]">
                            <span className="text-[11px] text-gray-500 mb-1.5 font-medium">{m.l}</span>
                            <span className={`text-[13px] font-bold tracking-wide ${m.c || 'text-white'}`}>{m.v}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* RIGHT TRADE PANEL */}
            <div className="w-[340px] bg-[#131722] rounded-2xl border border-[#1C212D] p-5 flex flex-col shrink-0 shadow-sm">
                <div className="flex items-center gap-6 border-b border-[#1C212D] pb-4 mb-5">
                    {['Trade', 'Depth', 'Info'].map(t => (
                        <button 
                            key={t} 
                            onClick={() => setActiveTradeTab(t)}
                            className={`text-[13px] font-medium pb-4 -mb-[17px] relative ${activeTradeTab === t ? 'text-[#00E6A8]' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {t}
                            {activeTradeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00E6A8]"></div>}
                        </button>
                    ))}
                </div>
                
                {activeTradeTab === 'Trade' && (
                  <>
                    <div className="flex gap-2 mb-6 bg-[#1C212D] p-1 rounded-xl border border-gray-800">
                        <button 
                            onClick={() => setOrderSide('BUY')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${orderSide === 'BUY' ? 'bg-[#00E6A8] text-[#0B0E14] shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Buy
                        </button>
                        <button 
                            onClick={() => setOrderSide('SELL')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${orderSide === 'SELL' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            Sell
                        </button>
                    </div>
                    
                    <div className="flex justify-between mb-8 border border-[#1C212D] rounded-xl overflow-hidden bg-[#0B0E14]/50">
                        {['Market', 'Limit', 'SL', 'SL-M'].map((t) => (
                            <button 
                                key={t}
                                onClick={() => setOrderType(t.toUpperCase())}
                                className={`flex-1 text-[11px] font-medium py-2.5 border-r border-[#1C212D] last:border-0 transition-colors ${orderType === t.toUpperCase() ? 'bg-gray-800/80 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-col gap-5 mb-auto">
                        <div>
                            <label className="block text-[11px] text-gray-500 font-medium mb-2.5">Quantity (Shares)</label>
                            <div className="flex items-center bg-[#0B0E14] rounded-xl border border-[#1C212D] focus-within:border-gray-600 transition-colors p-1.5">
                                <input 
                                    type="number" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="bg-transparent w-full text-white px-3 py-2 outline-none text-lg font-medium"
                                />
                                <div className="flex gap-1.5 shrink-0">
                                    <button className="w-10 h-10 flex items-center justify-center bg-[#1C212D] hover:bg-gray-800 rounded-lg text-gray-400 transition-colors" onClick={() => setQuantity(Math.max(1, quantity-1))}><Minus className="w-4 h-4" /></button>
                                    <button className="w-10 h-10 flex items-center justify-center bg-[#1C212D] hover:bg-gray-800 rounded-lg text-gray-400 transition-colors" onClick={() => setQuantity(quantity+1)}><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-4 border-b border-[#1C212D]">
                            <span className="text-[11px] text-gray-500 font-medium">Approx. Order Value</span>
                            <span className="text-sm text-white font-bold tracking-wide">₹{totalValue.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" id="bracket" className="rounded border-gray-700 bg-transparent text-[#00E6A8] focus:ring-[#00E6A8] focus:ring-offset-0" />
                            <label htmlFor="bracket" className="text-[11px] text-gray-400 group-hover:text-gray-300 font-medium transition-colors">Bracket Order (SL + Target)</label>
                            <Info className="w-3.5 h-3.5 text-gray-500 ml-0.5" />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleOrder}
                        disabled={submitting}
                        className={`w-full py-4 mt-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${orderSide === 'BUY' ? 'bg-[#00E6A8] hover:bg-[#00c58f] text-[#0B0E14] shadow-[#00E6A8]/20' : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'} ${submitting ? 'opacity-50' : ''}`}
                    >
                        {submitting ? 'Processing...' : (orderSide === 'BUY' ? 'Place Buy Order' : 'Place Sell Order')}
                        {!submitting && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                    </button>
                  </>
                )}

                {activeTradeTab === 'Depth' && (
                  <div className="flex-1 flex flex-col mt-2">
                      <div className="grid grid-cols-2 gap-4 mb-3 border-b border-[#1C212D] pb-2">
                          <div>
                              <div className="text-[10px] text-gray-500 uppercase font-medium flex justify-between">
                                  <span>Bid (Buy)</span><span>Qty</span>
                              </div>
                          </div>
                          <div>
                              <div className="text-[10px] text-gray-500 uppercase font-medium flex justify-between">
                                  <span>Ask (Sell)</span><span>Qty</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar flex">
                          <div className="w-1/2 pr-2 border-r border-[#1C212D]">
                              {[...Array(8)].map((_, i) => (
                                  <div key={i} className="flex justify-between items-center mb-2.5">
                                      <span className="text-xs text-[#00E6A8] font-bold">{(activePrice - (i*0.45 + 0.1)).toFixed(2)}</span>
                                      <span className="text-xs text-gray-300 font-medium">{Math.floor(Math.random() * 500) + 50}</span>
                                  </div>
                              ))}
                          </div>
                          <div className="w-1/2 pl-2">
                              {[...Array(8)].map((_, i) => (
                                  <div key={i} className="flex justify-between items-center mb-2.5">
                                      <span className="text-xs text-rose-500 font-bold">{(activePrice + (i*0.35 + 0.1)).toFixed(2)}</span>
                                      <span className="text-xs text-gray-300 font-medium">{Math.floor(Math.random() * 500) + 50}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-[#1C212D] flex justify-between">
                          <div className="flex flex-col">
                              <span className="text-[10px] text-gray-500">Total Buy Qty</span>
                              <span className="text-sm font-bold text-[#00E6A8]">12,450</span>
                          </div>
                          <div className="flex flex-col items-end">
                              <span className="text-[10px] text-gray-500">Total Sell Qty</span>
                              <span className="text-sm font-bold text-rose-500">18,320</span>
                          </div>
                      </div>
                  </div>
                )}

                {activeTradeTab === 'Info' && (
                  <div className="flex-1 flex flex-col mt-2">
                      <h3 className="text-base font-bold text-white mb-1 truncate">{fundamentals?.company_name || selectedStock || 'Company Name'}</h3>
                      <p className="text-xs text-gray-400 mb-6 truncate">{fundamentals?.sector || 'Financial Services'}</p>
                      
                      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                          <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#1C212D]">
                              <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1 font-medium">Market Scale</p>
                              <p className="text-sm text-gray-200 font-semibold">{fundamentals?.scale || 'Large Cap'}</p>
                          </div>
                          <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#1C212D]">
                              <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1 font-medium">Delivery %</p>
                              <p className="text-sm text-[#00E6A8] font-bold">{fundamentals?.delivery_pct || '54.2%'}</p>
                          </div>
                          <div className="bg-[#0B0E14] p-3 rounded-xl border border-[#1C212D]">
                              <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1 font-medium">Trend Strength</p>
                              <p className="text-sm text-white font-semibold">MACD Signal: Positive</p>
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Momentum bias is showing strong continuation patterns.</p>
                          </div>
                      </div>
                  </div>
                )}
            </div>
        </div>

        {/* BOTTOM WIDGETS ROW */}
        <div className="flex gap-5 shrink-0">
            
            {/* Left Bottom Panel (Positions & Recent Trades) */}
            <div className="flex-1 bg-[#131722] rounded-2xl border border-[#1C212D] p-5 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-[#1C212D]">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setBottomTab('Positions')} 
                            className={`text-[13px] font-semibold flex items-center gap-2.5 pb-3 -mb-px border-b-2 transition-colors ${bottomTab === 'Positions' ? 'text-white border-[#00E6A8]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            <Activity className="w-4 h-4" />
                            Your Positions ({activePositions.length})
                        </button>
                        <button 
                            onClick={() => setBottomTab('Recent Trades')} 
                            className={`text-[13px] font-semibold flex items-center gap-2.5 pb-3 -mb-px border-b-2 transition-colors ${bottomTab === 'Recent Trades' ? 'text-white border-[#00E6A8]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            <Clock className="w-4 h-4" />
                            Recent Trades
                        </button>
                    </div>
                    <Link to="/orders" className="text-[11px] text-gray-400 hover:text-white font-medium flex items-center gap-1 pb-3">View All <ChevronDown className="w-3 h-3 -rotate-90" /></Link>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-40">
                    {bottomTab === 'Positions' ? (
                        activePositions.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-xs py-8">No active positions.</div>
                        ) : (
                            activePositions.map(t => {
                                const entryPx = parseFloat(t.price || 0);
                                const qty = parseFloat(t.quantity || 0);
                                const livePx = getPositionLivePrice(t);
                                const pnl = t.side === 'BUY' ? (livePx - entryPx) * qty : (entryPx - livePx) * qty;
                                const pnlPct = (pnl / (entryPx * qty)) * 100;
                                const isPnlPos = pnl >= 0;
                                return (
                                    <div key={t.trade_code} className="grid grid-cols-6 gap-y-3 gap-x-2 pb-3 mb-3 border-b border-[#1C212D] last:border-0 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 mb-0.5 font-medium">Symbol</span>
                                            <span className="text-xs text-white font-bold">{t.symbol}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 mb-0.5 font-medium">Qty / Side</span>
                                            <span className={`text-xs font-bold ${t.side==='BUY'?'text-[#00E6A8]':'text-rose-500'}`}>{qty} {t.side}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 mb-0.5 font-medium">Avg Price</span>
                                            <span className="text-xs text-gray-300">₹{entryPx.toFixed(2)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 mb-0.5 font-medium">LTP</span>
                                            <span className="text-xs text-white font-bold">₹{livePx.toFixed(2)}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 mb-0.5 font-medium">P&L</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${isPnlPos ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                                                    {isPnlPos ? '+' : ''}₹{pnl.toFixed(2)}
                                                </span>
                                                <span className={`text-[9px] ${isPnlPos ? 'text-[#00E6A8]' : 'text-rose-500'}`}>({isPnlPos ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={() => closeTrade(t.trade_code, livePx)} className="text-[10px] px-3 py-1.5 bg-[#1C212D] rounded border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors">Square Off</button>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    ) : (
                        trades?.length === 0 ? (
                             <div className="h-full flex items-center justify-center text-gray-500 text-xs py-8">No recent trades.</div>
                        ) : (
                            trades?.map((t, i) => {
                                const d = new Date(t.timestamp || Date.now());
                                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const isBuy = t.side === 'BUY';
                                return (
                                <div key={i} className="flex items-center justify-between text-xs group pb-3 mb-3 border-b border-[#1C212D] last:border-0">
                                    <div className="flex items-center gap-3.5 w-[25%] shrink-0">
                                        <span className={`w-2 h-2 rounded-full shadow-sm ${isBuy ? 'bg-[#00E6A8]' : 'bg-rose-500'}`}></span>
                                        <span className="text-gray-500 font-medium">{timeStr}</span>
                                    </div>
                                    <span className="text-white w-[25%] text-left font-semibold truncate">{t.symbol}</span>
                                    <div className="w-[50%] flex justify-between text-right pl-2">
                                        <span className="text-gray-400 font-medium truncate">{t.status}</span>
                                        <span className="text-gray-400 font-medium">₹{t.price}</span>
                                        <span className={`font-semibold ml-2 shrink-0 ${isBuy ? 'text-[#00E6A8]' : 'text-rose-500'}`}>{t.quantity} Shares</span>
                                    </div>
                                </div>
                                );
                            })
                        )
                    )}
                </div>
            </div>

            {/* Today's Performance (Right Bottom Panel, matched width with Trade Panel) */}
            <div className="w-[340px] bg-[#131722] rounded-2xl border border-[#1C212D] p-5 flex flex-col justify-between shadow-sm shrink-0">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[13px] font-semibold text-white flex items-center gap-2.5">
                        <BarChart3 className="w-4 h-4 text-gray-400" />
                        Today's Performance
                    </h3>
                    <div className="flex items-center gap-2 bg-[#1C212D] px-2 py-1 rounded border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors">
                        <span className="text-[11px] text-gray-300 font-medium">1D</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                    </div>
                </div>
                <div className="flex justify-between items-end mt-2 px-1">
                    <div className="flex flex-col">
                        <span className={`text-3xl font-bold tracking-tight mb-1 ${todayPnL >= 0 ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                            {todayPnL >= 0 ? '+' : ''}₹{todayPnL.toFixed(2)}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">Today's P&L</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-base font-bold mb-1 ${todayReturn >= 0 ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                            {todayReturn >= 0 ? '+' : ''}{todayReturn.toFixed(2)}%
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">Today's Return</span>
                    </div>
                </div>
                <div className="mt-5 px-1 pb-1">
                    <div className="h-2 w-full bg-[#1C212D] rounded-full flex overflow-hidden mb-3 border border-gray-800">
                        <div className="h-full bg-[#00E6A8] rounded-full shadow-[0_0_10px_rgba(0,230,168,0.5)]" style={{ width: `${Math.min(100, (cash/totalVal)*100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px]">
                        <div className="flex flex-col">
                            <span className="text-white font-bold mb-0.5">₹{totalVal.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                            <span className="text-gray-500 font-medium">Portfolio Value</span>
                        </div>
                        <div className="flex flex-col text-center">
                            <span className="text-white font-bold mb-0.5">₹{cash.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                            <span className="text-gray-500 font-medium">Cash</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-white font-bold mb-0.5">₹{usedMargin.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                            <span className="text-gray-500 font-medium">Used Margins</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};
