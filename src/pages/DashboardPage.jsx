import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { ArrowRight, Clock, Crosshair, LayoutDashboard, TerminalSquare, BrainCircuit, History } from 'lucide-react';

export const DashboardPage = () => {
  const { portfolio, trades, disciplineScore, setSelectedStock, marketStatus } = useTrading();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derived Portfolio Metrics
  const totalValue = portfolio?.total_value || 100000;
  const initialBalance = portfolio?.initial_balance || 100000;
  const totalPnL = portfolio?.total_pnl || 0;
  const pnlPercentage = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;
  const cashAvailable = portfolio?.cash_balance || initialBalance;
  const investedAmount = portfolio?.invested || 0;
  const isPositivePnL = totalPnL >= 0;

  const utilizationPct = (investedAmount / totalValue) * 100;
  const cashPct = (cashAvailable / totalValue) * 100;

  // Active positions derived from trades
  const openPositions = trades?.filter(t => t.status === 'EXECUTED') || [];
  
  const formatRupee = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

  // Watchlist Tape
  const watchlist = [
    { symbol: 'NIFTY 50', price: 24820.20, change: 0.84, range: '24,620–24,910' },
    { symbol: 'SENSEX', price: 81240.10, change: 0.72, range: '80,940–81,480' },
    { symbol: 'ADANIENT', price: 2988.68, change: -0.65, range: '2,960–3,020' },
    { symbol: 'TCS', price: 3845.20, change: 0.42, range: '3,810–3,860' },
    { symbol: 'INFY', price: 1505.30, change: -0.18, range: '1,490–1,520' },
  ];

  // History / Session Activity
  const recentActivity = trades?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-[#050812] text-gray-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      
      {/* ─── 1. TOP NAVBAR STRIP ─── */}
      <div className="border-b border-gray-900 bg-[#050812] px-6 lg:px-12 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">FinAI Dashboard</span>
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-4">
          <span>{time.toLocaleTimeString('en-US', { hour12: false })} IST</span>
          {marketStatus?.is_open ? <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-900/50">MARKET: OPEN</span> : <span className="text-amber-400 bg-amber-950/30 px-2 py-0.5 border border-amber-900/50">MARKET: CLOSED</span>}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-24">
        
        {/* ─── 2. PORTFOLIO COMMAND CENTER (HERO) ─── */}
        <section className="mb-16">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Portfolio Command Center &middot; Paper Trading Engine</div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-gray-900 pb-12">
            <div>
              <div className="text-5xl md:text-7xl font-light font-mono tabular-nums tracking-tighter text-white leading-none">
                {formatRupee(totalValue)}
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-4">Total Portfolio Value</div>
            </div>
            
            <div className="text-left md:text-right">
              <div className={`text-3xl md:text-4xl font-light font-mono tabular-nums tracking-tight ${isPositivePnL ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositivePnL ? '+' : ''}{formatRupee(totalPnL)}
                <span className="ml-4 text-xl opacity-80">{isPositivePnL ? '+' : ''}{pnlPercentage.toFixed(2)}%</span>
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-3 flex items-center md:justify-end gap-6">
                <span>Today's P&L</span>
                <span>Today's Return</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. EQUITY CURVE (MAIN VISUAL) ─── */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Portfolio Performance</h2>
            <div className="flex gap-2">
              {['1D', '1W', '1M', '3M', 'ALL'].map(tf => (
                <button key={tf} className="text-[9px] font-mono text-gray-500 uppercase tracking-widest px-2 py-1 border border-gray-900 hover:text-white hover:border-gray-700 transition-colors">
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full h-[400px] border border-gray-900 bg-[#0a1020]/50 relative overflow-hidden flex flex-col">
            {portfolio?.history && portfolio.history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={portfolio.history} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d9ff" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#00d9ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 0" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050812', borderColor: '#1f2937', borderRadius: 0, padding: '12px' }}
                    itemStyle={{ color: '#00d9ff', fontSize: '13px', fontFamily: 'monospace' }}
                    labelStyle={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#00d9ff" strokeWidth={1.5} fill="url(#equityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Crosshair className="w-8 h-8 text-gray-800 mb-4" />
                <div className="text-sm font-mono text-gray-400 mb-2">Insufficient trading history to display an equity curve.</div>
                <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Execute paper trades to begin tracking performance.</div>
              </div>
            )}
          </div>
        </section>

        {/* ─── LAYOUT: 60/40 SPLIT ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Left Column (60%) */}
          <div className="lg:col-span-7 space-y-16">
            
            {/* 4. CAPITAL ALLOCATION */}
            <section>
              <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Capital Allocation</h2>
              <div className="border border-gray-900 bg-[#0a1020]/30 p-8">
                
                <div className="flex justify-between items-baseline mb-6">
                  <div className="text-2xl font-mono text-white tracking-tight tabular-nums">{formatRupee(totalValue)}</div>
                  <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Total Capital</div>
                </div>

                <div className="h-3 w-full flex bg-gray-900 mb-8 border border-gray-800 relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${utilizationPct}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-cyan-500 relative group cursor-crosshair">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cashPct}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }} className="h-full bg-gray-700 relative group cursor-crosshair">
                     <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-gray-900 pt-6">
                  <div>
                    <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-cyan-500" /> Invested</div>
                    <div className="text-lg font-mono text-white tabular-nums tracking-tight">{formatRupee(investedAmount)}</div>
                    <div className="text-xs font-mono text-gray-500 mt-1">{utilizationPct.toFixed(1)}% &middot; {openPositions.length} Positions</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-gray-600" /> Available Cash</div>
                    <div className="text-lg font-mono text-white tabular-nums tracking-tight">{formatRupee(cashAvailable)}</div>
                    <div className="text-xs font-mono text-gray-500 mt-1">{cashPct.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. OPEN POSITIONS LEDGER */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Open Positions</h2>
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-0.5 border border-cyan-900/50">{openPositions.length} ACTIVE</span>
              </div>
              
              <div className="border border-gray-900 bg-[#0a1020]/30 overflow-x-auto">
                {openPositions.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-900 bg-[#050812]">
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal whitespace-nowrap">Symbol</th>
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal whitespace-nowrap">Side</th>
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right whitespace-nowrap">Qty</th>
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right whitespace-nowrap">Entry</th>
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right whitespace-nowrap">LTP</th>
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right whitespace-nowrap">P&L</th>
                        <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right whitespace-nowrap">Return</th>
                        <th className="py-3 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[11px]">
                      {openPositions.map((pos, idx) => (
                        <tr key={idx} className="group border-b border-gray-900/50 hover:bg-[#0f1728] transition-colors">
                          <td className="py-3 px-4 text-white font-bold">{pos.symbol}</td>
                          <td className="py-3 px-4"><span className={`px-1.5 py-0.5 border ${pos.type === 'BUY' ? 'text-emerald-400 border-emerald-900/50' : 'text-rose-400 border-rose-900/50'}`}>{pos.type === 'BUY' ? 'LONG' : 'SHORT'}</span></td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-300">{pos.quantity}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-gray-400">₹{pos.price}</td>
                          <td className="py-3 px-4 text-right tabular-nums text-white">₹{pos.price}</td> {/* Mocking LTP */}
                          <td className="py-3 px-4 text-right tabular-nums text-emerald-400">+₹0</td>
                          <td className="py-3 px-4 text-right tabular-nums text-emerald-400">+0.00%</td>
                          <td className="py-3 px-4 text-right">
                            <Link to="/terminal" onClick={() => setSelectedStock(pos.symbol)} className="opacity-0 group-hover:opacity-100 text-[9px] text-cyan-400 hover:text-cyan-300 transition-opacity uppercase tracking-widest">View</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">No Open Positions</div>
                    <div className="text-sm font-sans text-gray-400 mb-6">Your portfolio currently has no active paper trades.</div>
                    <Link to="/terminal" className="text-[10px] font-mono text-black bg-white hover:bg-gray-200 transition-colors px-6 py-2 uppercase tracking-widest font-bold">Open Terminal</Link>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Right Column (40%) */}
          <div className="lg:col-span-5 space-y-16">
            
            {/* 6. PORTFOLIO HEALTH */}
            <section>
              <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Portfolio Health</h2>
              <div className="border border-gray-900 bg-[#0a1020]/30 p-8 flex flex-col gap-6">
                
                <div className="flex justify-between items-end border-b border-gray-900 pb-6">
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Multi-Factor Assessment</div>
                  <div className="text-4xl font-mono font-light text-white tabular-nums tracking-tighter leading-none">{disciplineScore}<span className="text-xl text-gray-600">/100</span></div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Capital Utilization', val: 42, color: 'bg-cyan-500' },
                    { label: 'Diversification', val: 75, color: 'bg-emerald-500' },
                    { label: 'Liquidity', val: 100, color: 'bg-blue-500' },
                    { label: 'Risk Concentration', val: 60, color: 'bg-amber-500' }
                  ].map(factor => (
                    <div key={factor.label}>
                      <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex justify-between">
                        <span>{factor.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-900 border border-gray-800">
                        <div className={`h-full ${factor.color}`} style={{ width: `${factor.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 mt-2 border-t border-gray-900">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-1">Health Status: GOOD</div>
                  <div className="text-xs font-sans text-gray-500 leading-relaxed">Portfolio is liquid with moderate capital utilization. Low concentration risk.</div>
                </div>

              </div>
            </section>

            {/* 7. PORTFOLIO EXPOSURE */}
            <section>
              <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Portfolio Exposure</h2>
              <div className="border border-gray-900 bg-[#0a1020]/30 p-8">
                <div className="space-y-4 font-mono text-[11px] mb-8">
                  {[
                    { sym: 'ADANIENT', pct: 38 },
                    { sym: 'TCS', pct: 24 },
                    { sym: 'INFY', pct: 18 },
                    { sym: 'RELIANCE', pct: 12 },
                    { sym: 'OTHER', pct: 8 }
                  ].map(exp => (
                    <div key={exp.sym} className="flex items-center gap-4">
                      <div className="w-20 text-gray-400">{exp.sym}</div>
                      <div className="flex-1 h-2 bg-gray-900 border border-gray-800">
                        <div className="h-full bg-cyan-800" style={{ width: `${exp.pct}%` }} />
                      </div>
                      <div className="w-10 text-right tabular-nums text-white">{exp.pct}%</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-900">
                  <div>
                    <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Largest Position</div>
                    <div className="text-xs font-mono text-white">ADANIENT <span className="text-gray-500 ml-1">38%</span></div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Gross Exposure</div>
                    <div className="text-xs font-mono text-white">{formatRupee(investedAmount)}</div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* ─── 8. LOWER SECTION: MARKET TAPE, TIMELINE, QUICK DOCK ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-5 space-y-16">
             {/* MARKET WATCHLIST TAPE */}
             <section>
              <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Market Tape
              </h2>
              <div className="border border-gray-900 bg-[#0a1020]/30 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-900">
                      <th className="py-2 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Symbol</th>
                      <th className="py-2 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Price</th>
                      <th className="py-2 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Change</th>
                      <th className="py-2 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right hidden sm:table-cell">Day Range</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px]">
                    {watchlist.map(item => (
                      <tr key={item.symbol} className="border-b border-gray-900/50 hover:bg-[#0f1728] transition-colors">
                        <td className="py-3 px-4 text-white font-bold">{item.symbol}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-gray-300">{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className={`py-3 px-4 text-right tabular-nums ${item.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%</td>
                        <td className="py-3 px-4 text-right tabular-nums text-gray-500 hidden sm:table-cell">{item.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-16">
            {/* TODAY'S SESSION TIMELINE */}
            <section>
              <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Today's Session</h2>
              <div className="border border-gray-900 bg-[#0a1020]/30 p-8 h-[320px] overflow-y-auto">
                {recentActivity.length > 0 ? (
                  <div className="relative border-l border-gray-800 ml-3 space-y-8 pb-4">
                    {recentActivity.map((act, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-[#050812] border border-cyan-900 rounded-full" />
                        <div className="text-[10px] font-mono text-gray-500 mb-1">{new Date(act.timestamp).toLocaleTimeString('en-US', { hour12: false })}</div>
                        <div className="text-xs font-mono text-white flex items-center gap-2">
                          <span className={act.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{act.type}</span> {act.symbol}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 mt-1">{act.quantity} shares &middot; ₹{act.price}</div>
                      </div>
                    ))}
                    <div className="relative pl-6 opacity-50">
                      <div className="absolute -left-1 top-1.5 w-2 h-2 bg-[#050812] border border-gray-700 rounded-full" />
                      <div className="text-[10px] font-mono text-gray-500 mb-1">09:15:00</div>
                      <div className="text-xs font-mono text-gray-400">MARKET OPEN</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <Clock className="w-5 h-5 text-gray-800 mb-3" />
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">No Trading Activity Today</div>
                    <div className="text-xs font-sans text-gray-600">Your paper portfolio has no executed trades in this session.</div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-3 space-y-16">
            {/* QUICK ACTIONS DOCK */}
            <section>
              <h2 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-px bg-gray-900 border border-gray-900">
                <Link to="/terminal" className="bg-[#050812] p-4 flex items-center justify-between hover:bg-[#0a1020] transition-colors group">
                  <div className="flex items-center gap-3">
                    <TerminalSquare className="w-4 h-4 text-cyan-500" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-gray-300 group-hover:text-cyan-400 transition-colors">Open Terminal</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link to="/intelligence" className="bg-[#050812] p-4 flex items-center justify-between hover:bg-[#0a1020] transition-colors group">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="w-4 h-4 text-purple-500" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-gray-300 group-hover:text-purple-400 transition-colors">Intelligence</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link to="/orders" className="bg-[#050812] p-4 flex items-center justify-between hover:bg-[#0a1020] transition-colors group">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-gray-500" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-gray-300 group-hover:text-white transition-colors">Trade History</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </section>
          </div>

        </div>

      </div>
    </div>
  );
};
