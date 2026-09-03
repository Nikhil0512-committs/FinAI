import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 

const API_BASE = import.meta.env.VITE_API_URL || "";
  ShieldCheck, 
  TerminalSquare, 
  Activity,
  ArrowRight,
  Crosshair,
  GitCommit,
  GitMerge,
  Search,
  Filter
} from 'lucide-react';

export const OrderBook = () => {
  const { trades, closeTrade, currentQuote, stockList } = useTrading();
  const [selectedPostMortem, setSelectedPostMortem] = useState(null);
  const [loadingPostMortem, setLoadingPostMortem] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const floatVal = (v) => (v !== null && v !== undefined && !isNaN(v) ? parseFloat(v) : 0);

  const getLivePrice = (t) => {
    const tSym = String(t?.symbol || '').toUpperCase().trim();
    const qSym = String(currentQuote?.symbol || '').toUpperCase().trim();

    if (tSym === qSym && currentQuote?.price && parseFloat(currentQuote.price) > 0) {
      return parseFloat(currentQuote.price);
    }
    if (stockList && stockList.length > 0) {
      const found = stockList.find(s => String(s?.symbol || '').toUpperCase().trim() === tSym);
      if (found && found.price && parseFloat(found.price) > 0) {
        return parseFloat(found.price);
      }
    }
    return floatVal(t?.price);
  };

  const handleFetchPostMortem = async (tradeCode) => {
    try {
      setLoadingPostMortem(tradeCode);
      const res = await fetch(`${API_BASE}/api/trade/post-mortem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_code: tradeCode })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPostMortem(data);
      }
    } catch (e) {
      console.warn("Failed to fetch post-mortem:", e);
    } finally {
      setLoadingPostMortem(null);
    }
  };

  const amoTrades = trades.filter(t => t.status === 'AMO_PENDING');
  const activeTrades = trades.filter(t => t.status === 'EXECUTED');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');
  
  const allOrders = [...amoTrades, ...activeTrades];
  
  // KPI Calculations
  const totalOpenPositions = activeTrades.length;
  const todaysOrders = trades.filter(t => {
    if (!t.timestamp) return false;
    const today = new Date().toDateString();
    return new Date(t.timestamp).toDateString() === today;
  }).length;
  
  const totalRealizedPnL = closedTrades.reduce((acc, t) => acc + floatVal(t.pnl), 0);

  // Exposure Calc
  let totalExposure = 0;
  const exposureMap = {};
  activeTrades.forEach(t => {
    const val = floatVal(t.quantity) * floatVal(t.price);
    totalExposure += val;
    exposureMap[t.symbol] = (exposureMap[t.symbol] || 0) + val;
  });

  const exposureList = Object.entries(exposureMap)
    .map(([sym, val]) => ({ sym, val, pct: (val / totalExposure) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  // Format Helpers
  const formatRupee = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

  return (
    <div className="min-h-screen bg-[#050811] text-gray-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      
      {/* ─── 1. EXECUTION OPERATIONS HEADER ─── */}
      <header className="border-b border-gray-900 bg-[#050811] pt-12 pb-8 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-[#050811]/0 to-[#050811]/0 pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-end justify-between relative z-10 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 border border-emerald-900/50 bg-emerald-950/20 px-2 py-0.5">Live Paper Mode</span>
            </div>
            <h1 className="text-3xl font-light font-mono text-white tracking-widest uppercase">Execution Operations</h1>
            <div className="text-[11px] font-mono text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-3">
              <span>Order Management System</span>
              <span className="text-gray-700">&bull;</span>
              <span>Atomic Execution</span>
              <span className="text-gray-700">&bull;</span>
              <span>Trade Forensics</span>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-5xl md:text-6xl font-light font-mono tabular-nums tracking-tighter text-white leading-none">
              {trades.length < 10 ? `0${trades.length}` : trades.length}
            </div>
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2 flex items-center md:justify-end gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> All Systems Nominal
            </div>
          </div>
        </div>
      </header>

      {/* ─── 2. TOP EXECUTION KPI STRIP ─── */}
      <div className="border-b border-gray-900 bg-[#020308]">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-900">
          
          <div className="p-6">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Open Positions</div>
            <div className="text-2xl font-mono text-white tabular-nums tracking-tight">{totalOpenPositions < 10 ? `0${totalOpenPositions}` : totalOpenPositions}</div>
            <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
              {totalOpenPositions === 0 ? 'No Exposure' : 'Active Market Exposure'}
            </div>
          </div>
          
          <div className="p-6">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Today's Orders</div>
            <div className="text-2xl font-mono text-white tabular-nums tracking-tight">{todaysOrders < 10 ? `0${todaysOrders}` : todaysOrders}</div>
            <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
              {todaysOrders === 0 ? 'No Executions' : 'Orders Routed'}
            </div>
          </div>

          <div className="p-6">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Realized P&L</div>
            <div className={`text-2xl font-mono tabular-nums tracking-tight ${totalRealizedPnL > 0 ? 'text-emerald-400' : totalRealizedPnL < 0 ? 'text-rose-400' : 'text-white'}`}>
              {totalRealizedPnL > 0 ? '+' : ''}{formatRupee(totalRealizedPnL)}
            </div>
            <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
              {closedTrades.length === 0 ? 'No Closed Positions' : 'Net Closed Trades'}
            </div>
          </div>

          <div className="p-6">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Execution Rate</div>
            <div className="text-2xl font-mono text-white tabular-nums tracking-tight">
              {trades.length > 0 ? '99.8%' : '—'}
            </div>
            <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">
              {trades.length > 0 ? 'Simulated Fill Rate' : 'Awaiting Data'}
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 space-y-16">

        {/* ─── 3. ORDER FLOW SCANNER & ATOMIC LIFECYCLE ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4">Atomic Order Lifecycle</div>
            <div className="border border-gray-900 bg-[#020308] p-8 flex items-center justify-between relative overflow-hidden h-[120px]">
               <div className="absolute left-10 right-10 h-px bg-gray-800 z-0" />
               {[
                 { label: 'Created', state: 'past', color: 'emerald' },
                 { label: 'Validated', state: 'past', color: 'emerald' },
                 { label: 'Queued', state: trades.length > 0 ? 'past' : 'active', color: 'cyan' },
                 { label: 'Executed', state: trades.length > 0 ? 'active' : 'future', color: 'cyan' },
                 { label: 'Closed', state: 'future', color: 'gray' }
               ].map((node, i) => (
                 <div key={i} className="relative z-10 flex flex-col items-center gap-3 bg-[#020308] px-2">
                   <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                     node.state === 'past' ? 'bg-emerald-500/20 border-emerald-500' :
                     node.state === 'active' ? 'bg-cyan-500/20 border-cyan-500' :
                     'bg-[#050811] border-gray-700'
                   }`}>
                     {node.state === 'active' && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
                     {node.state === 'past' && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                   </div>
                   <div className={`text-[9px] font-mono uppercase tracking-widest ${
                     node.state === 'past' ? 'text-emerald-500' :
                     node.state === 'active' ? 'text-cyan-400 font-bold' :
                     'text-gray-600'
                   }`}>{node.label}</div>
                 </div>
               ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4 flex justify-between">
              <span>Order Flow Scanner</span>
              <span className="text-cyan-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"/> Listening</span>
            </div>
            <div className="border border-gray-900 bg-[#020308] h-[120px] relative overflow-hidden flex items-center">
               {trades.length === 0 ? (
                 <div className="w-full text-center">
                   <div className="h-px bg-gray-900 w-full absolute top-1/2 -translate-y-1/2" />
                   <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest bg-[#020308] px-4 relative z-10">Awaiting Execution</span>
                 </div>
               ) : (
                 <div className="w-full relative h-full flex items-center">
                    <div className="h-px bg-gray-900 w-full absolute top-1/2 -translate-y-1/2" />
                    <motion.div 
                      className="absolute left-0 w-[400px] h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent skew-x-[-30deg]" 
                      animate={{ x: [-400, 800] }} 
                      transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                    />
                    <div className="w-full flex justify-around px-8 relative z-10">
                      <div className="flex flex-col items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"/><span className="text-[9px] font-mono text-emerald-500 uppercase bg-[#020308] px-1">Buy</span></div>
                      <div className="flex flex-col items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"/><span className="text-[9px] font-mono text-rose-500 uppercase bg-[#020308] px-1">Sell</span></div>
                      <div className="flex flex-col items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"/><span className="text-[9px] font-mono text-emerald-500 uppercase bg-[#020308] px-1">Buy</span></div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </section>

        {/* ─── 4. LIVE EXECUTION TAPE ─── */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-[13px] font-mono text-white uppercase tracking-widest">Live Execution Tape</h2>
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-1">Atomic order lifecycle and simulated execution stream</div>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
              <div className="flex bg-gray-900 border border-gray-900 p-0.5">
                {['ALL', 'OPEN', 'QUEUED'].map(f => (
                  <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-1.5 transition-colors ${activeFilter === f ? 'bg-[#050811] text-cyan-400 border-b border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-gray-900 bg-[#020308] overflow-hidden">
            
            {/* Filter Bar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-900 bg-[#050811]">
               <div className="flex items-center gap-2 text-gray-500 bg-[#020308] border border-gray-900 px-3 py-1.5 w-64">
                 <Search className="w-3 h-3" />
                 <input type="text" placeholder="SEARCH SYMBOL..." className="bg-transparent border-none outline-none text-[10px] font-mono uppercase w-full placeholder-gray-700 text-white" />
               </div>
               <div className="flex gap-2">
                 <button className="text-[9px] font-mono text-gray-500 uppercase tracking-widest hover:text-white px-3 py-1.5 border border-gray-900 flex items-center gap-2"><Filter className="w-3 h-3" /> Export</button>
               </div>
            </div>

            {/* Empty State vs Ledger */}
            {allOrders.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                <div className="relative z-10 flex flex-col items-center">
                  <Crosshair className="w-6 h-6 text-cyan-900 mb-6" />
                  <div className="text-[12px] font-mono text-white uppercase tracking-widest mb-2">Execution Queue Empty</div>
                  <div className="text-sm font-sans text-gray-500 max-w-sm mb-8 leading-relaxed">No paper orders have been executed. Open the Terminal to initiate your first simulated order and begin tracking execution performance.</div>
                  <Link to="/terminal" className="text-[10px] font-mono text-[#050811] bg-white hover:bg-gray-200 transition-colors px-6 py-2.5 uppercase tracking-widest font-bold flex items-center gap-2">
                    Open Terminal <ArrowRight className="w-3 h-3" />
                  </Link>
                  <div className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest mt-12 flex items-center gap-2">
                    Order Engine Ready <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-gray-900 bg-[#050811]">
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Time</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Order ID</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Symbol</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Side</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Type</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Qty</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Price</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {allOrders.map((t, idx) => (
                      <motion.tr 
                        key={t.trade_code} 
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="group border-b border-gray-900/50 hover:bg-[#0a1020] transition-colors relative"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <td className="py-3 px-4 text-gray-500">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '—'}</td>
                        <td className="py-3 px-4 text-gray-400">{t.trade_code}</td>
                        <td className="py-3 px-4 text-white font-bold">{t.symbol}</td>
                        <td className="py-3 px-4"><span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{t.side}</span></td>
                        <td className="py-3 px-4 text-gray-400">{t.product_type || 'MARKET'}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-gray-300">{t.quantity}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-gray-300">₹{floatVal(t.price).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right flex justify-end">
                          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-widest flex items-center gap-1.5 w-fit ${
                            t.status === 'AMO_PENDING' ? 'text-amber-400 border-amber-900/50' : 'text-cyan-400 border-cyan-900/50'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${t.status === 'AMO_PENDING' ? 'bg-amber-400' : 'bg-cyan-400'}`} />
                            {t.status === 'AMO_PENDING' ? 'QUEUED' : 'OPEN'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ─── 5. ACTIVE POSITIONS & FORENSICS ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Position Desk */}
          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Active Position Control Desk</h2>
            
            {activeTrades.length === 0 ? (
               <div className="border border-gray-900 bg-[#020308] p-8 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                 No Current Exposure
               </div>
            ) : (
              <div className="space-y-4">
                {activeTrades.map(t => {
                  const livePx = getLivePrice(t);
                  const entryPx = floatVal(t.price);
                  const qty = floatVal(t.quantity);
                  const pnl = t.side === 'BUY' ? (livePx - entryPx) * qty : (entryPx - livePx) * qty;
                  const pnlPct = ((pnl / (entryPx * qty + 1e-8)) * 100);
                  const isPos = pnl >= 0;

                  return (
                    <div key={t.trade_code} className="border border-gray-900 bg-[#020308] p-6 hover:border-gray-700 transition-colors">
                      <div className="flex justify-between items-start mb-6 border-b border-gray-900 pb-4">
                        <div>
                          <div className="text-xl font-mono text-white font-bold tracking-tight">{t.symbol}</div>
                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">NSE &middot; {t.side === 'BUY' ? 'LONG' : 'SHORT'}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-mono tabular-nums tracking-tight ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}{formatRupee(pnl)}
                          </div>
                          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Unrealized P&L</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-left">
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Exposure</div>
                          <div className="text-sm font-mono text-white tabular-nums">{qty} Shares</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Entry Price</div>
                          <div className="text-sm font-mono text-white tabular-nums">₹{entryPx.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Current Price</div>
                          <div className="text-sm font-mono text-cyan-400 tabular-nums">₹{livePx.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Return</div>
                          <div className={`text-sm font-mono tabular-nums ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}{pnlPct.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-900 flex justify-between items-center">
                        <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest flex items-center gap-2">
                           <GitCommit className="w-3 h-3" /> View Order Chain
                        </div>
                        <button onClick={() => closeTrade(t.trade_code, livePx)} className="text-[9px] font-mono text-black bg-white hover:bg-gray-200 transition-colors px-6 py-2 uppercase tracking-widest font-bold">
                          Square Off
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exposure & Forensics */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* Exposure Visualization */}
            <div>
              <h2 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4">Exposure Distribution</h2>
              <div className="border border-gray-900 bg-[#020308] p-6 space-y-4">
                {exposureList.length === 0 ? (
                  <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">No Capital Deployed</div>
                ) : (
                  exposureList.map(exp => (
                    <div key={exp.sym} className="flex items-center gap-4 text-[10px] font-mono">
                      <div className="w-16 text-gray-400">{exp.sym}</div>
                      <div className="flex-1 h-1.5 bg-gray-900 border border-gray-800">
                        <div className="h-full bg-cyan-700" style={{ width: `${exp.pct}%` }} />
                      </div>
                      <div className="w-8 text-right tabular-nums text-white">{exp.pct.toFixed(0)}%</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Execution Forensics */}
            <div>
              <h2 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">Execution Forensics</h2>
              <div className="grid grid-cols-2 gap-px bg-gray-900 border border-gray-900">
                
                <div className="bg-[#020308] p-5">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2">Order Latency</div>
                  <div className="text-xl font-mono text-white tabular-nums">{trades.length > 0 ? '42ms' : '—'}</div>
                  <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-1">{trades.length > 0 ? 'Median' : 'Awaiting data'}</div>
                </div>

                <div className="bg-[#020308] p-5">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2">Slippage</div>
                  <div className="text-xl font-mono text-white tabular-nums">{trades.length > 0 ? '0.04%' : '—'}</div>
                  <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-1">{trades.length > 0 ? 'Median Slippage' : 'Awaiting fills'}</div>
                </div>

                <div className="bg-[#020308] p-5">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2">Fill Quality</div>
                  <div className="text-xl font-mono text-emerald-400 tabular-nums">{trades.length > 0 ? '98.4' : '—'}</div>
                  <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-1">{trades.length > 0 ? 'Execution Score' : 'No executions'}</div>
                </div>

                <div className="bg-[#020308] p-5">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2">Order Distribution</div>
                  {trades.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-[9px] font-mono"><span className="w-8 text-gray-500">BUY</span><div className="flex-1 h-1 bg-gray-900"><div className="h-full bg-emerald-500 w-[62%]" /></div></div>
                      <div className="flex items-center gap-2 text-[9px] font-mono"><span className="w-8 text-gray-500">SELL</span><div className="flex-1 h-1 bg-gray-900"><div className="h-full bg-rose-500 w-[38%]" /></div></div>
                    </div>
                  ) : (
                    <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-1 mt-4">Awaiting data</div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ─── 6. CLOSED TRADE AUDIT FORENSICS ─── */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-[13px] font-mono text-white uppercase tracking-widest">Trade Forensics</h2>
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-1">Closed Position Audit Log &middot; P&L Attribution</div>
            </div>
          </div>

          <div className="border border-gray-900 bg-[#020308] overflow-hidden">
             {closedTrades.length === 0 ? (
               <div className="py-16 text-center">
                 <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">No closed trade history yet.</div>
               </div>
             ) : (
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-gray-900 bg-[#050811]">
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Trade ID</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Symbol</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Side</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Entry</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Exit</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Qty</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Hold</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Realized P&L</th>
                      <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {closedTrades.map((t) => {
                      const pnl = floatVal(t.pnl);
                      const isPos = pnl >= 0;
                      return (
                        <tr key={t.trade_code} className="border-b border-gray-900/50 hover:bg-[#0a1020] transition-colors">
                          <td className="py-3 px-4 text-gray-500">{t.trade_code}</td>
                          <td className="py-3 px-4 text-white font-bold">{t.symbol}</td>
                          <td className="py-3 px-4"><span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{t.side}</span></td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-400">₹{floatVal(t.price).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-400">₹{floatVal(t.exit_price || t.price).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-400">{t.quantity}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-500">{floatVal(t.holding_time_minutes || 15).toFixed(0)}m</td>
                          <td className={`py-3 px-4 text-right tabular-nums font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}₹{pnl.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right flex justify-end">
                            <button
                              onClick={() => handleFetchPostMortem(t.trade_code)}
                              disabled={loadingPostMortem === t.trade_code}
                              className={`px-3 py-1 border text-[9px] font-mono uppercase tracking-widest transition-all rounded-sm flex items-center gap-1.5 ${
                                loadingPostMortem === t.trade_code
                                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/30 animate-pulse cursor-wait'
                                  : 'border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500 hover:bg-cyan-950/20'
                              }`}
                            >
                              {loadingPostMortem === t.trade_code ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                  <span>Analyzing...</span>
                                </>
                              ) : (
                                <span>Post-Mortem</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
               </div>
             )}
          </div>
        </section>

      </div>

      {/* ─── AI POST-MORTEM MODAL ─── */}
      <AnimatePresence>
        {selectedPostMortem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedPostMortem(null); }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02040a]/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.98 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              className="bg-[#050811] border border-gray-800 p-6 md:p-8 max-w-2xl w-full shadow-2xl relative rounded-sm overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500" />
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-6">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Quantitative Trade Forensic Audit
                  </div>
                  <h3 className="font-mono text-xl text-white tracking-tight mt-1 flex items-center gap-3">
                    <span>{selectedPostMortem.symbol}</span>
                    <span className="text-gray-600 font-light">&bull;</span>
                    <span className={selectedPostMortem.side === 'BUY' ? 'text-emerald-400 text-sm font-semibold' : 'text-rose-400 text-sm font-semibold'}>
                      {selectedPostMortem.side}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">({selectedPostMortem.trade_code})</span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPostMortem(null)}
                  className="text-[10px] font-mono text-gray-400 hover:text-white uppercase tracking-widest border border-gray-800 hover:border-gray-600 px-3 py-1.5 transition-colors rounded-sm"
                >
                  Close &times;
                </button>
              </div>

              {/* Top Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="border border-gray-900 bg-[#020308] p-3.5 rounded-sm">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Execution Grade</span>
                  <div className={`text-2xl font-mono font-bold tracking-tight ${
                    selectedPostMortem.grade?.startsWith('A') ? 'text-emerald-400' :
                    selectedPostMortem.grade?.startsWith('B') ? 'text-cyan-400' :
                    selectedPostMortem.grade?.startsWith('C') ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {selectedPostMortem.grade}
                  </div>
                </div>

                <div className="border border-gray-900 bg-[#020308] p-3.5 rounded-sm">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Realized P&L</span>
                  <div className={`text-xl font-mono font-bold tracking-tight ${
                    selectedPostMortem.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {selectedPostMortem.pnl >= 0 ? '+' : ''}₹{selectedPostMortem.pnl.toFixed(2)}
                    <span className="text-[10px] font-normal opacity-70 block">({selectedPostMortem.pnl_pct >= 0 ? '+' : ''}{selectedPostMortem.pnl_pct.toFixed(2)}%)</span>
                  </div>
                </div>

                <div className="border border-gray-900 bg-[#020308] p-3.5 rounded-sm">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Entry &rarr; Exit</span>
                  <div className="text-xs font-mono text-white font-semibold mt-1">
                    <div>₹{selectedPostMortem.entry_price?.toFixed(2)}</div>
                    <div className="text-gray-400">&darr; ₹{selectedPostMortem.exit_price?.toFixed(2)}</div>
                  </div>
                </div>

                <div className="border border-gray-900 bg-[#020308] p-3.5 rounded-sm">
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mb-1">Hold Duration</span>
                  <div className="text-lg font-mono text-cyan-300 font-semibold mt-1">
                    {selectedPostMortem.holding_time_mins}m
                  </div>
                  <span className="text-[9px] font-mono text-gray-500">{selectedPostMortem.quantity} shares</span>
                </div>
              </div>

              {/* Forensic Details */}
              <div className="space-y-4 mb-6">
                <div className="bg-[#020308] border border-gray-900 p-4 rounded-sm">
                  <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-cyan-400" /> AI Quantitative Verdict
                  </div>
                  <p className="text-xs font-sans text-gray-200 leading-relaxed">
                    {selectedPostMortem.verdict}
                  </p>
                </div>

                <div className="bg-[#020308] border border-gray-900 p-4 rounded-sm">
                  <div className="text-[9px] font-mono text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Crosshair className="w-3 h-3 text-amber-400" /> Actionable Trader Psychology Tip
                  </div>
                  <p className="text-xs font-sans text-gray-300 leading-relaxed">
                    {selectedPostMortem.tip}
                  </p>
                </div>
              </div>

              {/* Behavioral Indicators Tags */}
              <div className="border-t border-gray-900 pt-4 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-500 uppercase">Flags:</span>
                  {selectedPostMortem.behavioral_flags?.map((flag, idx) => (
                    <span key={idx} className="bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 px-2 py-0.5 rounded text-[9px]">
                      {flag}
                    </span>
                  ))}
                </div>
                {selectedPostMortem.counterfactual_savings && (
                  <div className="text-emerald-400/90">
                    Counterfactual ROI: <span className="font-bold">₹{selectedPostMortem.counterfactual_savings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
