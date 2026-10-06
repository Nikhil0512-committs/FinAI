import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const BehavioralTwin = () => {
  const { trades, userId } = useTrading();
  const [projectionData, setProjectionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  const fetchProjection = async () => {
    setLoading(true);
    try {
      const activeUser = userId || 'usr_guest';
      const res = await fetch(`${API_BASE}/api/behavioral-twin?user_id=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProjectionData(data.projection);
        } else {
          setProjectionData(null);
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
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Running Monte Carlo Simulations...</div>
      </div>
    );
  }

  if (!projectionData || !projectionData.projection_data || projectionData.projection_data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border border-gray-900 bg-[#020308] p-8 text-center">
        <AlertCircle className="w-8 h-8 text-gray-700 mb-4" />
        <div className="text-sm font-mono text-gray-400 mb-2">Insufficient History for Behavioral Twin</div>
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest max-w-md">
          Execute and close at least 6 paper trades with a mix of wins and losses to generate your 30-day behavioral projection.
        </div>
      </div>
    );
  }

  const { projection_data, final_difference, current_final, disciplined_final, metrics } = projectionData;
  const savings = Math.abs(final_difference);
  const isPositiveSavings = final_difference > 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050812] border border-gray-800 p-3 shadow-2xl min-w-[180px]">
          <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-rose-400 font-medium">You Now</span>
              <span className="text-white font-bold tracking-tight">₹{payload[0]?.value?.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-emerald-400 font-medium">Disciplined You</span>
              <span className="text-white font-bold tracking-tight">₹{payload[1]?.value?.toFixed(0)}</span>
            </div>
            <div className="pt-1.5 mt-1.5 border-t border-gray-800 flex items-center justify-between gap-4 text-[11px] font-mono">
              <span className="text-gray-500">Difference</span>
              <span className="text-cyan-400 font-bold tracking-tight">₹{Math.abs(payload[1]?.value - payload[0]?.value).toFixed(0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-gray-900 bg-[#020308] flex flex-col h-full">
      <div className="p-8 border-b border-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> 30-Day Behavioral Projection
          </div>
          <h2 className="text-3xl font-light font-mono text-white tracking-tight uppercase">
            "Future You" Simulator
          </h2>
          <p className="text-[11px] font-sans text-gray-400 mt-2 max-w-xl">
            A Monte Carlo resample of your own past trades. Shows the 30-day trajectory of continuing your current habits vs. following your own discipline rules. Not a market prediction.
          </p>
        </div>
        
        <div className="text-left md:text-right">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Cost of Emotions (30 Days)</div>
          <div className="text-4xl font-light font-mono tabular-nums tracking-tighter text-cyan-400">
            ₹{savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 relative">
        <div className="absolute top-6 right-8 z-10 flex gap-6 text-[9px] font-mono uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> You Now
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Disciplined You
          </div>
        </div>
        
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection_data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="disciplinedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="1 4" stroke="#0f172a" vertical={false} />
              <XAxis dataKey="day" stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#334155" tick={{ fontSize: 9, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `₹${val}`} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }} />
              
              <Area 
                type="monotone" 
                dataKey="current_you" 
                stroke="#f43f5e" 
                strokeWidth={2} 
                fill="url(#currentGradient)" 
                name="You Now" 
              />
              <Area 
                type="monotone" 
                dataKey="disciplined_you" 
                stroke="#10b981" 
                strokeWidth={2} 
                fill="url(#disciplinedGradient)" 
                name="Disciplined You" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#050812] border-t border-gray-900 grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 border-b md:border-b-0 md:border-r border-gray-900">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Habit: Revenge Trading</span>
          </div>
          <div className="text-2xl font-mono text-white tracking-tight">{metrics.revenge_freq_pct}%</div>
          <div className="text-[9px] font-sans text-gray-400 mt-1">of your losses trigger an immediate re-entry attempt.</div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Habit: Size Escalation</span>
          </div>
          <div className="text-2xl font-mono text-white tracking-tight">{metrics.escalation_freq_pct}%</div>
          <div className="text-[9px] font-sans text-gray-400 mt-1">of your trades are oversized to recover from a previous loss.</div>
        </div>
      </div>
    </div>
  );
};
