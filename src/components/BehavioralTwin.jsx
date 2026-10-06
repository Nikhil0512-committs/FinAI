import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  ReferenceDot
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw, ShieldCheck, Target, CheckCircle2 } from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';

export const BehavioralTwin = () => {
  const { trades } = useTrading();
  const { userId } = useAuth();
  const [projectionData, setProjectionData] = useState(null);
  const [simplifiedData, setSimplifiedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLegacy, setShowLegacy] = useState(false);
  const [ruleAccepted, setRuleAccepted] = useState(false);
  const [ruleThreshold, setRuleThreshold] = useState(15);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  
  const handleTakeRule = async () => {
    try {
      const activeUser = userId || 'usr_guest';
      const res = await fetch(`${API_BASE}/api/behavioral-twin/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser, rule_type: simplifiedData.top_leak, threshold: parseFloat(ruleThreshold) })
      });
      if (res.ok) setRuleAccepted(true);
    } catch (e) { console.error(e); }
  };

  const fetchProjection = async () => {
    setLoading(true);
    try {
      const activeUser = userId || 'usr_guest';
      const res = await fetch(`${API_BASE}/api/behavioral-twin?user_id=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProjectionData(data.projection);
          setSimplifiedData(data.simplified);
          if (data.simplified?.rule_accepted) {
            setRuleAccepted(true);
            setRuleThreshold(data.simplified.accepted_threshold);
          }
        } else {
          setProjectionData(null);
          setSimplifiedData(null);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch projection:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjection();
  }, [trades.length, userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border border-gray-900 bg-[#020308]">
        <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin mb-4" />
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Running Behavioral Diagnostics...</div>
      </div>
    );
  }

  // --- LEGACY PROJECTION VIEW ---
  if (showLegacy && projectionData) {
    const { projection_data, final_difference, metrics } = projectionData;
    const savings = Math.abs(final_difference);
    return (
      <div className="border border-gray-900 bg-[#020308] flex flex-col h-full relative">
        <button 
          onClick={() => setShowLegacy(false)}
          className="absolute top-4 right-4 z-20 text-[10px] bg-gray-900 text-white px-3 py-1 uppercase tracking-widest hover:bg-gray-800 transition-colors"
        >
          Back to Trade View
        </button>
        
        {/* Render Legacy Layout (Condensed for brevity) */}
        <div className="p-4 sm:p-6 md:p-4 sm:p-6 md:p-8 border-b border-gray-900 flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Legacy Monte Carlo
            </div>
            <h2 className="text-2xl font-light font-mono text-white tracking-tight uppercase">30-Day Projection</h2>
          </div>
          <div className="text-left md:text-right">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Projected Gap</div>
            <div className="text-3xl font-light font-mono text-cyan-400">₹{savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
        <div className="flex-1 p-4 sm:p-6 relative min-h-[300px]">
          <div className="w-full h-[300px]"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 4" stroke="#0f172a" vertical={false} />
              <XAxis dataKey="day" stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
              <YAxis stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickFormatter={(val) => `₹${val}`} />
              <Area type="monotone" dataKey="current_you" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
              <Area type="monotone" dataKey="disciplined_you" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer></div>
        </div>
      </div>
    );
  }

  // --- EMPTY STATE ---
  if (!simplifiedData || simplifiedData.status === 'EMPTY_STATE') {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border border-gray-900 bg-[#020308] p-4 sm:p-6 md:p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-emerald-500 mb-4 opacity-80" />
        <div className="text-sm font-mono text-white tracking-tight uppercase mb-2">No Costly Psychological Leaks Detected</div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest max-w-md">
          Your recent sample lacks statistically significant tilt events. Keep adhering to your current discipline rules.
        </div>
        {projectionData && (
           <button 
             onClick={() => setShowLegacy(true)}
             className="mt-6 text-[10px] text-gray-400 underline uppercase tracking-widest hover:text-white"
           >
             View 30-Day Projection
           </button>
        )}
      </div>
    );
  }

  // --- SIMPLIFIED INTRADAY VIEW ---
  
  // Calculate Chart Data
  let cumReal = 0;
  let cumCounter = 0;
  const chartData = (simplifiedData.round_trips || []).map((rt, index) => {
    cumReal += rt.net_pnl;
    if (!rt.is_tilt) {
      cumCounter += rt.net_pnl;
    }
    return {
      index: index + 1,
      real: cumReal,
      counter: cumCounter,
      is_tilt: rt.is_tilt,
      pnl: rt.net_pnl
    };
  });

  const topLeak = simplifiedData.top_leak === 'REVENGE' ? 'Revenge Trading' : 'Size Escalation';
  const confidenceColor = simplifiedData.confidence === 'HIGH' ? 'text-emerald-400' : (simplifiedData.confidence === 'MEDIUM' ? 'text-amber-400' : 'text-gray-400');
  
  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#050812] border border-gray-800 p-3 shadow-2xl min-w-[150px]">
          <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest">Trade {data.index}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4 text-[11px] font-mono">
              <span className="text-rose-400">Real PnL</span>
              <span className="text-white">₹{data.real.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px] font-mono">
              <span className="text-gray-500">Counterfactual</span>
              <span className="text-gray-300">₹{data.counter.toFixed(0)}</span>
            </div>
            {data.is_tilt && (
              <div className="pt-2 mt-2 border-t border-gray-800 text-[10px] text-rose-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <AlertCircle className="w-3 h-3"/> Tilt Event Identified
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-gray-900 bg-[#020308] flex flex-col h-full overflow-hidden">
      
      {/* 1. HERO VERDICT */}
      <div className="p-4 sm:p-6 md:p-4 sm:p-6 md:p-8 border-b border-gray-900 bg-gradient-to-br from-rose-950/20 to-transparent">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
              <div className="text-[10px] font-mono text-rose-500 uppercase tracking-widest flex items-center gap-2 border border-rose-900/50 bg-rose-950/30 px-2 py-1">
                <Target className="w-3.5 h-3.5" /> Primary Leak Detected
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase">
                Based on {simplifiedData.events} events
              </div>
              <div className={`text-[10px] font-mono uppercase ${confidenceColor}`}>
                Conf: {simplifiedData.confidence}
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-light font-mono text-white tracking-tight leading-snug">
              {topLeak} cost you <span className="text-rose-400 font-medium">₹{simplifiedData.net_tilt_cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> recently.
            </h2>
            
            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#0a0f1a] p-4 border border-gray-800 rounded-sm">
              <div className="flex-1">
                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Generated Rule</div>
                <div className="text-sm text-cyan-400 font-mono">
                  {topLeak === 'Revenge Trading' ? (
                    <>No re-entry within <input type="number" className="bg-transparent border-b border-cyan-700 w-12 text-center focus:outline-none" value={ruleThreshold} onChange={(e)=>setRuleThreshold(e.target.value)} /> minutes of a loss.</>
                  ) : (
                    <>Do not size up above {ruleThreshold}x your median after a loss.</>
                  )}
                </div>
              </div>
              {ruleAccepted ? (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest border border-emerald-900/50 bg-emerald-950/30 px-4 py-2">
                  <CheckCircle2 className="w-4 h-4"/> Rule Accepted
                </div>
              ) : (
                <button 
                  onClick={handleTakeRule}
                  className="whitespace-nowrap px-6 py-2 bg-white text-black text-xs font-mono font-bold uppercase tracking-widest hover:bg-cyan-400 transition-colors"
                >
                  Take This Rule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. OVERLAY CHART */}
      <div className="flex-1 p-4 sm:p-6 relative flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 z-10">
          <div className="flex flex-wrap gap-3 sm:gap-6 text-[9px] font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="w-3 h-[2px] bg-rose-500" /> Real Equity
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-3 h-[2px] border-b border-dashed border-gray-500" /> Counterfactual
            </div>
            <div className="flex items-center gap-2 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]" /> Tilt Trade
            </div>
          </div>
          <button 
            onClick={() => setShowLegacy(true)}
            className="text-[9px] text-cyan-500 hover:text-cyan-400 underline uppercase tracking-widest font-mono"
          >
            See 30-Day Projection
          </button>
        </div>
        
        <div className="flex-1 min-h-[250px] w-full">
          <div className="w-full h-[300px]"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="1 4" stroke="#0f172a" vertical={false} />
              <XAxis dataKey="index" stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={10} minTickGap={20} />
              <YAxis stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `₹${val}`} />
              
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
              
              <Line 
                type="stepAfter" 
                dataKey="counter" 
                stroke="#64748b" 
                strokeWidth={1.5} 
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              
              <Line 
                type="stepAfter" 
                dataKey="real" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.is_tilt) {
                    return <circle cx={cx} cy={cy} r={4} fill="#e11d48" stroke="#020308" strokeWidth={2} key={`dot-${payload.index}`} />;
                  }
                  return <React.Fragment key={`empty-${payload.index}`} />;
                }}
              />
            </LineChart>
          </ResponsiveContainer></div>
        </div>
        
        <div className="mt-2 text-center text-[9px] text-gray-600 font-mono italic">
          * Removing past trades mathematically alters subsequent decisions; this counterfactual is an estimate.
        </div>
      </div>
      
    </div>
  );
};
