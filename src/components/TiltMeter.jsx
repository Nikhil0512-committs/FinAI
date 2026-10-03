import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

export const TiltMeter = ({ currentTradeValue = 10000, sentimentTag = 'Neutral', onTiltCritical }) => {
  const { trades, userId } = useTrading();
  const [tiltScore, setTiltScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchTiltScore = async () => {
      setLoading(true);
      try {
        const activeUser = userId || 'usr_guest';
        const res = await fetch(`${API_BASE}/api/tilt-score?user_id=${encodeURIComponent(activeUser)}&current_trade_value=${currentTradeValue}&sentiment_tag=${encodeURIComponent(sentimentTag)}`);
        if (res.ok) {
          const data = await res.json();
          setTiltScore(data.tilt_score || 0);
          
          if (data.tilt_score > 70 && onTiltCritical) {
            onTiltCritical(data.tilt_score);
          } else if (data.tilt_score <= 70 && onTiltCritical) {
            onTiltCritical(0);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch tilt score:", e);
      } finally {
        setLoading(false);
      }
    };
    
    // Throttle fetches
    const timer = setTimeout(() => {
      fetchTiltScore();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [trades.length, currentTradeValue, sentimentTag, userId, onTiltCritical]);

  const getStatusColor = () => {
    if (tiltScore < 40) return 'emerald';
    if (tiltScore < 70) return 'amber';
    return 'rose';
  };

  const getStatusText = () => {
    if (tiltScore < 40) return 'CALM / DISCIPLINED';
    if (tiltScore < 70) return 'ELEVATED / CAUTION';
    if (tiltScore < 85) return 'TILTED / RISKY';
    return 'CRITICAL / STOP';
  };

  const color = getStatusColor();
  const radius = 45;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  // Map 0-100 score to 0-180 degree arc
  const arcLength = (tiltScore / 100) * (circumference / 2);
  const strokeDashoffset = circumference - arcLength;

  return (
    <div className={`p-4 border bg-[#02040a] transition-colors duration-500 ${color === 'rose' ? 'border-rose-900/50 shadow-[0_0_15px_rgba(225,29,72,0.15)]' : 'border-gray-900'} mb-6`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 text-${color}-400`} />
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Behavioral Tilt</span>
        </div>
        <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 border ${color === 'emerald' ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20' : color === 'amber' ? 'text-amber-400 border-amber-900/50 bg-amber-950/20' : 'text-rose-400 border-rose-900/50 bg-rose-950/20'}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Arc Gauge */}
        <div className="relative w-24 h-14 overflow-hidden flex items-end justify-center">
          <svg className="w-24 h-24 transform -rotate-180" viewBox="0 0 100 100">
            {/* Background arc */}
            <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth={stroke} fill="transparent" strokeDasharray={`${circumference / 2} ${circumference / 2}`} />
            
            {/* Value arc */}
            <motion.circle
              cx="50" cy="50" r={radius}
              stroke={color === 'emerald' ? '#34d399' : color === 'amber' ? '#fbbf24' : '#f43f5e'}
              strokeWidth={stroke} fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - arcLength }}
              transition={{ duration: 1, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute bottom-0 w-full text-center pb-1">
            <span className="text-xl font-mono text-white tabular-nums tracking-tighter">{tiltScore}</span>
            <span className="text-[9px] font-mono text-gray-600">/100</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="text-[9px] font-sans text-gray-400 leading-relaxed">
            {tiltScore < 40 && "Your sizing and entry timing look rational. Proceed."}
            {tiltScore >= 40 && tiltScore < 70 && "You are trading faster or larger than your baseline. Ensure this isn't emotional."}
            {tiltScore >= 70 && "You are exhibiting clear signs of revenge trading or FOMO. Take a breath."}
          </div>
          
          <AnimatePresence>
            {tiltScore >= 70 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-[9px] font-mono text-rose-400 uppercase tracking-widest flex items-center gap-1 mt-1"
              >
                <ShieldAlert className="w-3 h-3" /> System Friction Active
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
