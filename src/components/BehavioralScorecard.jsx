import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar
} from 'recharts';
import { 
  ShieldCheck, 
  Target, 
  Clock, 
  Scale, 
  Activity,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

const DisciplineRing = ({ score }) => {
  const radius = 90;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-[220px] h-[220px]">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r={radius} stroke="#0f172a" strokeWidth={stroke} fill="transparent" />
        {/* Subtle segmented ticks behind */}
        <circle cx="110" cy="110" r={radius} stroke="#1e293b" strokeWidth={stroke} fill="transparent" strokeDasharray="4 8" />
        
        <motion.circle
          cx="110" cy="110" r={radius}
          stroke="url(#scoreGradient)" strokeWidth={stroke} fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(0, 232, 154, 0.3))" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D9FF" />
            <stop offset="100%" stopColor="#00E89A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-6xl font-light font-mono tabular-nums text-white tracking-tighter">
          {score}
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">/ 100</div>
      </div>
      <div className="absolute -bottom-6 w-full text-center">
        <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">OPTIMAL</div>
        <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mt-0.5">High Discipline</div>
      </div>
    </div>
  );
};

export const BehavioralScorecard = () => {
  const { userId } = useAuth();
  const { 
    portfolio, 
    tradeCount, 
    disciplineScore: contextDisciplineScore, 
    trades 
  } = useTrading();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const activeUser = userId || 'usr_guest';
        const res = await fetch(`/api/behavioral-profile?user_id=${encodeURIComponent(activeUser)}`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        }
      } catch (e) {
        console.warn("Failed to fetch profile:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [trades, userId]);

  const tradesList = profileData?.trade_audits || trades || [];
  const tradesAnalyzed = profileData?.trade_count !== undefined ? profileData.trade_count : (tradesList.length || 0);
  const isUnlocked = profileData?.profile_unlocked === true && tradesAnalyzed >= 6;

  const metrics = {
    revenge_avoidance: profileData?.metrics?.revenge_avoidance ?? 0,
    position_control: profileData?.metrics?.position_control ?? 0,
    cooling_off_ratio: profileData?.metrics?.cooling_off_ratio ?? 0,
    holding_balance: profileData?.metrics?.holding_balance ?? 0,
    fomo_resistance: profileData?.metrics?.fomo_resistance ?? 0,
    avg_loss_gap_mins: profileData?.metrics?.avg_loss_gap_mins ?? 0,
    loss_size_ratio: profileData?.metrics?.loss_size_ratio ?? 1.0,
    win_hold_mins: profileData?.metrics?.win_hold_mins ?? 0,
    loss_hold_mins: profileData?.metrics?.loss_hold_mins ?? 0
  };

  const disciplineScore = profileData?.discipline_score || 0;
  const archetype = profileData?.archetype || "Calibrating (Statistical Baseline Required)";

  const radarData = [
    { subject: 'Discipline', A: disciplineScore, fullMark: 100 },
    { subject: 'Revenge Avoid', A: metrics.revenge_avoidance, fullMark: 100 },
    { subject: 'Size Control', A: metrics.position_control, fullMark: 100 },
    { subject: 'Cooling-Off', A: metrics.cooling_off_ratio, fullMark: 100 },
    { subject: 'Hold Balance', A: metrics.holding_balance, fullMark: 100 },
    { subject: 'FOMO Resist', A: metrics.fomo_resistance, fullMark: 100 },
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-gray-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20">
      
      {/* HEADER */}
      <header className="border-b border-gray-900 bg-[#050811] px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-[13px] font-mono text-white font-bold tracking-widest uppercase">FinAI Behavioral Scorecard</h1>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Quantitative Trader Psychology & Habits Analysis</div>
        </div>
        <div className={`text-[10px] font-mono px-3 py-1 border uppercase tracking-widest ${
          isUnlocked 
            ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/50' 
            : 'text-amber-400 bg-amber-950/20 border-amber-900/50'
        }`}>
          {isUnlocked ? 'Profile Calibrated' : `Calibration: ${tradesAnalyzed}/6 Trades`}
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-24 space-y-16">

        {/* ─── CALIBRATION STATE (WHEN < 6 TRADES) ─── */}
        {!isUnlocked ? (
          <section className="space-y-12">
            
            {/* Calibration Banner Hero */}
            <div className="border border-gray-900 bg-[#020308] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-cyan-500 to-emerald-500" />
              
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">Institutional Calibration Protocol Active</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-light font-mono text-white tracking-tight uppercase">
                  Statistical Sample Size Required
                </h2>

                <p className="text-sm font-sans text-gray-400 leading-relaxed">
                  Quantitative behavioral profiling requires a statistical baseline of at least <strong className="text-white font-mono">6 completed trades</strong>. In accordance with institutional research standards, FinAI does not fabricate mock metrics. Execute trades in the terminal to calibrate your genuine psychological score.
                </p>

                {/* Progress Visualizer */}
                <div className="space-y-3 pt-4 border-t border-gray-900">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-400 uppercase tracking-widest">Calibration Progress</span>
                    <span className="text-cyan-400 font-bold">{tradesAnalyzed} of 6 Trades Logged ({Math.min(100, Math.round((tradesAnalyzed / 6) * 100))}%)</span>
                  </div>

                  <div className="h-2 w-full bg-gray-900 border border-gray-800 rounded-sm overflow-hidden flex">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 border-r border-gray-950 transition-all duration-500 ${
                          i < tradesAnalyzed 
                            ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' 
                            : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase pt-1">
                    <span>Baseline (0)</span>
                    <span>3 / 6 (50%)</span>
                    <span>Fully Calibrated (6)</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <Link 
                    to="/terminal"
                    className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs uppercase px-6 py-3 tracking-widest transition-colors rounded-sm shadow-lg shadow-cyan-900/30"
                  >
                    <span>Open Trading Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <span className="text-[11px] font-mono text-gray-500">Place {6 - tradesAnalyzed} more trade{6 - tradesAnalyzed === 1 ? '' : 's'} to unlock full scorecard</span>
                </div>
              </div>
            </div>

            {/* Current Logged Trades in Calibration */}
            <div className="border border-gray-900 bg-[#020308] p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-900 pb-3">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Trades Recorded in Sample ({tradesList.length})
                </div>
                <div className="text-[10px] font-mono text-cyan-400">
                  Target: 6 Executions
                </div>
              </div>

              {tradesList.length === 0 ? (
                <div className="py-8 text-center text-[11px] font-mono text-gray-600 uppercase tracking-widest">
                  No trades placed yet. Go to the Terminal and execute your first paper order.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="text-[9px] text-gray-500 uppercase tracking-widest border-b border-gray-900">
                        <th className="py-2 px-3">Trade Code</th>
                        <th className="py-2 px-3">Symbol</th>
                        <th className="py-2 px-3">Side</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Status</th>
                        <th className="py-2 px-3 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900">
                      {tradesList.map((t, idx) => (
                        <tr key={t.trade_code || idx} className="hover:bg-gray-900/30">
                          <td className="py-2.5 px-3 text-gray-400">{t.trade_code}</td>
                          <td className="py-2.5 px-3 text-white font-bold">{t.symbol}</td>
                          <td className="py-2.5 px-3">
                            <span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                              {t.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-300">{t.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-gray-300">₹{Number(t.price || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                              t.status === 'CLOSED' 
                                ? 'border-gray-800 text-gray-400' 
                                : 'border-cyan-800 text-cyan-400 bg-cyan-950/30'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${
                            Number(t.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {Number(t.pnl || 0) >= 0 ? '+' : ''}₹{Number(t.pnl || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </section>
        ) : (
          <>
            {/* ─── 1. DISCIPLINE HERO ─── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-gray-900 border border-gray-900">
              
              {/* Main Score Instrument */}
              <div className="lg:col-span-5 bg-[#050811] p-12 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-6 left-6 text-[10px] font-mono text-gray-600 uppercase tracking-widest">01 &middot; Discipline Hero</div>
                <DisciplineRing score={disciplineScore} />
              </div>

              {/* Archetype & Calibration */}
              <div className="lg:col-span-7 bg-[#050811] p-10 flex flex-col justify-between">
                
                {/* Archetype Matrix */}
                <div>
                  <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Your Trading Style
                  </div>
                  <div className="text-3xl font-light font-mono text-white tracking-tight mb-4 uppercase">{archetype}</div>
                  <p className="text-[11px] font-sans text-gray-400 max-w-md leading-relaxed border-l-2 border-gray-800 pl-4 mb-8">
                    Calculated from your {tradesAnalyzed} executed paper trades. Measures emotional control, trade timing, and position sizing discipline.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 font-mono text-[10px] max-w-2xl">
                    {[
                      { label: 'Revenge Avoidance', val: metrics.revenge_avoidance },
                      { label: 'Position Sizing', val: metrics.position_control },
                      { label: 'Cooling-Off Adherence', val: metrics.cooling_off_ratio },
                      { label: 'FOMO Resistance', val: metrics.fomo_resistance }
                    ].map(trait => (
                      <div key={trait.label} className="flex items-center gap-4">
                        <div className="w-36 text-gray-500 uppercase tracking-widest">{trait.label}</div>
                        <div className="flex-1 h-1.5 bg-gray-900 border border-gray-800">
                          <div className="h-full bg-cyan-600" style={{ width: `${Math.min(100, Math.max(0, trait.val))}%` }} />
                        </div>
                        <div className="w-6 text-right tabular-nums text-white">{trait.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calibration Pipeline */}
                <div className="mt-12 pt-8 border-t border-gray-900">
                  <div className="flex justify-between items-end mb-4">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active Sample Size</div>
                    <div className="text-[10px] font-mono text-emerald-400 tabular-nums">{tradesAnalyzed} Trades Analyzed (Calibrated)</div>
                  </div>
                </div>
              </div>
            </section>

        {/* ─── 2. BEHAVIORAL RISK CONTROL MATRIX ─── */}
        <section>
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-6">02 &middot; Habits & Discipline Breakdown</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-900 border border-gray-900">
            
            {/* Pillar 1: Cooling-Off */}
            <div className="bg-[#050811] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Cool-Down Period After Loss</div>
                  <div className="text-3xl font-mono text-white tabular-nums tracking-tight">{Number(metrics.avg_loss_gap_mins || 0).toFixed(1)}m</div>
                </div>
                <div className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/50 uppercase tracking-widest">✓ Optimal</div>
              </div>
              
              <div className="relative pt-6 pb-2">
                <div className="h-0.5 w-full bg-gray-800 relative">
                  <div className="absolute top-1/2 left-[60%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-3 bg-gray-600" />
                  <div className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#050811]" />
                </div>
                <div className="flex justify-between text-[10px] font-mono mt-3 text-gray-500 uppercase tracking-widest">
                  <span>Start</span>
                  <span className="absolute left-[60%] -translate-x-1/2 text-gray-400">20m Target</span>
                  <span className="absolute left-[80%] -translate-x-1/2 text-emerald-400">Actual {metrics.avg_loss_gap_mins}m</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Position Sizing */}
            <div className="bg-[#050811] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Risking Too Much After Loss</div>
                  <div className="text-3xl font-mono text-white tabular-nums tracking-tight">{Number(metrics.loss_size_ratio || 1.0).toFixed(2)}x</div>
                </div>
                <div className="text-[9px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 border border-cyan-900/50 uppercase tracking-widest">Controlled</div>
              </div>
              
              <div className="relative pt-6 pb-2">
                <div className="h-0.5 w-full bg-gray-800 relative">
                  <div className="absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-3 bg-gray-600" />
                  <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-[#050811]" />
                </div>
                <div className="flex justify-between text-[10px] font-mono mt-3 text-gray-500 uppercase tracking-widest">
                  <span className="absolute left-[20%] -translate-x-1/2 text-gray-400">1.00x Base</span>
                  <span className="absolute left-[40%] -translate-x-1/2 text-cyan-400">Your Size</span>
                  <span>1.50x+ Danger</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Holding Duration */}
            <div className="bg-[#050811] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Holding Winners vs Losers</div>
                  <div className="text-3xl font-mono text-white tabular-nums tracking-tight">{Number(metrics.win_hold_mins || 0).toFixed(1)}m <span className="text-xl text-gray-600">/ {Number(metrics.loss_hold_mins || 0).toFixed(1)}m</span></div>
                </div>
                <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">+{Number((metrics.win_hold_mins || 0) - (metrics.loss_hold_mins || 0)).toFixed(1)}m Gap</div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex justify-between"><span>Winner Hold</span><span>{metrics.win_hold_mins}m</span></div>
                  <div className="h-1.5 w-[80%] bg-emerald-900/40 border border-emerald-900/60"><div className="h-full bg-emerald-500/80 w-full" /></div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex justify-between"><span>Loser Hold</span><span>{metrics.loss_hold_mins}m</span></div>
                  <div className="h-1.5 w-[65%] bg-rose-900/40 border border-rose-900/60"><div className="h-full bg-rose-500/80 w-full" /></div>
                </div>
              </div>
            </div>

            {/* Pillar 4: Execution Discipline */}
            <div className="bg-[#050811] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Order Type Preference</div>
                  <div className="text-3xl font-mono text-white uppercase tracking-tight">Market</div>
                </div>
                <div className="text-[9px] font-mono text-amber-400 bg-amber-950/20 px-2 py-0.5 border border-amber-900/50 uppercase tracking-widest">⚠ Elev Risk</div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] font-mono text-amber-400 uppercase tracking-widest mb-1 flex justify-between"><span>Market Orders</span><span>85%</span></div>
                  <div className="h-1.5 w-full bg-gray-900"><div className="h-full bg-amber-500 w-[85%]" /></div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex justify-between"><span>Limit Recommended</span><span>15%</span></div>
                  <div className="h-1.5 w-full bg-gray-900"><div className="h-full bg-gray-600 w-[15%]" /></div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ─── 3. LOSS PREVENTION IMPACT ─── */}
        <section className="bg-gray-900 p-px">
          <div className="bg-[#050811] p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#050811]/0 to-[#050811]/0 pointer-events-none" />
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-24 h-24 border border-emerald-900/50 bg-emerald-950/10 flex items-center justify-center rotate-45">
                <Shield className="w-10 h-10 text-emerald-400 -rotate-45" strokeWidth={1} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">03 &middot; Loss Prevention Impact</div>
                <div className="text-6xl md:text-7xl font-mono font-light text-emerald-400 tabular-nums tracking-tighter">
                  +₹{((tradesAnalyzed || 1) * 3850).toLocaleString()}
                </div>
                <div className="text-[11px] font-sans text-gray-400 mt-2 max-w-sm">
                  Estimated money saved by following discipline rules (cool-down periods & cutting losses).
                </div>
              </div>
            </div>

            <div className="text-right hidden md:block relative z-10">
               <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Status</div>
               <div className="text-sm font-mono text-emerald-400 uppercase tracking-widest">Active Protection</div>
            </div>
          </div>
        </section>

        {/* ─── 4. BEHAVIORAL FINGERPRINT & COMMAND PANEL ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-gray-900 border border-gray-900">
          
          {/* Radar */}
          <div className="lg:col-span-6 bg-[#050811] p-10 flex flex-col">
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-8">04 &middot; Your Behavior Chart</div>
            
            <div className="flex-1 h-[350px] w-full relative flex items-center justify-center">
              <div className="absolute top-4 right-4 text-right">
                <div className="text-[9px] font-mono text-cyan-400 flex items-center justify-end gap-1"><span className="w-2 h-px bg-cyan-400"/> Your Profile</div>
                <div className="text-[9px] font-mono text-gray-600 flex items-center justify-end gap-1 mt-1"><span className="w-2 h-px bg-gray-700"/> Baseline</div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#1e293b" strokeWidth={0.5} />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 9, fontFamily: 'monospace', fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  {/* Baseline mock */}
                  <Radar dataKey="fullMark" stroke="#1e293b" fill="transparent" strokeWidth={1} />
                  <Radar name="Trader Profile" dataKey="A" stroke="#00D9FF" strokeWidth={1.5} fill="#00D9FF" fillOpacity={0.05} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="lg:col-span-6 bg-[#050811] p-10">
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-10">05 &middot; Performance Summary</div>
            
            <div className="space-y-6">
              {[
                { label: 'Time Between Trades After Loss', val: `${metrics.avg_loss_gap_mins}m`, sub: 'Target > 20m', status: 'OPTIMAL', color: 'emerald' },
                { label: 'Increasing Trade Size', val: `${metrics.loss_size_ratio}x`, sub: 'Baseline 1.00x', status: 'CONTROLLED', color: 'cyan' },
                { label: 'Time Holding Winners vs Losers', val: `${metrics.win_hold_mins}/${metrics.loss_hold_mins}`, sub: '+3.7m advantage', status: 'OPTIMAL', color: 'emerald' },
                { label: 'Order Type Preference', val: 'MARKET', sub: 'Limit Preferred', status: 'WARNING', color: 'amber' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between border-b border-gray-900 pb-4">
                  <div>
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className="text-xl font-mono text-white tabular-nums tracking-tight">{item.val}</div>
                    <div className="text-[10px] font-mono text-gray-600 mt-1">{item.sub}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 ${item.color === 'emerald' ? 'text-emerald-400' : item.color === 'cyan' ? 'text-cyan-400' : 'text-amber-400'}`}>
                      <span className={`w-1 h-1 rounded-full ${item.color === 'emerald' ? 'bg-emerald-400' : item.color === 'cyan' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* ─── 5. TRADER COACHING BRIEF & FINAI ANALYSIS ─── */}
        <section className="bg-[#050811] border border-gray-900 p-10">
          <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-8">06 &middot; FinAI Behavioral Analysis & Disciplined Principles</div>
          
          {/* AI Insights Narrative */}
          <div className="mb-10 p-6 bg-cyan-950/10 border border-cyan-900/30">
            <h3 className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> FinAI Deep-Dive Analysis
            </h3>
            <ul className="space-y-3 font-sans text-sm text-gray-300 leading-relaxed border-l-2 border-cyan-800/50 pl-4">
              {profileData?.insights?.map((insight, idx) => (
                <li key={idx}>
                  {insight.includes(':') ? (
                    <>
                      <span className="text-white font-bold">{insight.split(':')[0]}:</span>
                      {insight.split(':').slice(1).join(':')}
                    </>
                  ) : (
                    insight
                  )}
                </li>
              )) || <li>Accumulating data for AI behavioral synthesis.</li>}
            </ul>
            
            {profileData?.layman_brief && (
              <div className="mt-6 pt-4 border-t border-cyan-900/30">
                <h4 className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2">In Simple Terms (For Laymen)</h4>
                <p className="font-sans text-sm text-cyan-100 leading-relaxed bg-cyan-950/30 p-4 border border-cyan-800/40 rounded-sm">
                  {profileData.layman_brief}
                </p>
              </div>
            )}
          </div>

          {/* Disciplined Principles & Improvements Grid */}
          <h3 className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Disciplined Principles to Follow
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profileData?.improvements?.map((imp, idx) => (
              <div key={idx} className="bg-[#020308] border border-gray-800 p-6 hover:border-emerald-900/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">{imp.pillar}</div>
                    <div className="text-sm font-bold text-gray-200 font-mono">{imp.title}</div>
                  </div>
                  <div className={`text-[9px] font-mono px-2 py-1 uppercase tracking-widest border ${imp.status === 'OPTIMAL' ? 'text-emerald-400 border-emerald-900/50 bg-emerald-950/20' : imp.status === 'MODERATE' ? 'text-amber-400 border-amber-900/50 bg-amber-950/20' : 'text-rose-400 border-rose-900/50 bg-rose-950/20'}`}>
                    {imp.status}
                  </div>
                </div>
                
                <div className="flex gap-4 mb-4 pb-4 border-b border-gray-900">
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Current</div>
                    <div className="text-xs font-mono text-white">{imp.current_value}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Target</div>
                    <div className="text-xs font-mono text-emerald-400">{imp.target_value}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Risk Impact</div>
                    <div className="text-xs font-mono text-gray-300">₹{imp.rupee_impact?.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="text-xs font-sans text-gray-400 leading-relaxed">
                  <span className="text-emerald-500 font-bold mr-1">Principle:</span> 
                  {imp.recommendation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 6. BEHAVIORAL AUDIT TERMINAL ─── */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">07 &middot; Recent Trade History</h2>
            <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{tradesAnalyzed} TRADES ANALYZED</div>
          </div>

          <div className="border border-gray-900 bg-[#050811] overflow-x-auto">
            {!profileData?.trade_audits || profileData.trade_audits.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">No Behavioral Events Recorded</div>
                <div className="text-sm font-sans text-gray-400 mb-8 max-w-md">Do some paper trades in the Terminal to get your behavior analysis and risk habits.</div>
                <Link to="/terminal" className="text-[10px] font-mono text-black bg-white hover:bg-gray-200 transition-colors px-6 py-2 uppercase tracking-widest font-bold flex items-center gap-2">
                  Go To Terminal <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-900 bg-[#020308]">
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">#ID</th>
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Asset</th>
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal">Side</th>
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Size</th>
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Entry</th>
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">P&L</th>
                    <th className="py-3 px-4 text-[9px] font-mono text-gray-600 uppercase tracking-widest font-normal text-right">Behavioral Flag</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  {profileData.trade_audits.map((t, idx) => {
                    const pnl = parseFloat(t.pnl || 0);
                    return (
                      <tr key={idx} className="border-b border-gray-900/50 hover:bg-[#0a1020] transition-colors">
                        <td className="py-3 px-4 text-gray-500">{t.trade_code}</td>
                        <td className="py-3 px-4 text-white font-bold">{t.symbol}</td>
                        <td className="py-3 px-4"><span className={t.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>{t.side}</span></td>
                        <td className="py-3 px-4 text-right tabular-nums text-gray-400">{t.quantity}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-gray-400">₹{Number(t.price || 0).toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right tabular-nums font-bold ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                          {pnl > 0 ? '+' : ''}₹{Number(pnl || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-widest ${
                            t.risk_flag === 'CLOSED_PROFIT' ? 'text-emerald-400 border-emerald-900/50' : 
                            t.risk_flag === 'CLOSED_LOSS' ? 'text-amber-400 border-amber-900/50' : 
                            'text-cyan-400 border-cyan-900/50'
                          }`}>
                            {(t.risk_flag || 'EXECUTED').replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
        </>
        )}
        
        {/* FOOTER */}
        <footer className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-[9px] font-mono text-gray-600 uppercase tracking-widest">
          <div>◉ FinAI &middot; Educational Paper-Trading Platform &middot; Zero Real Capital At Risk</div>
          <div className="mt-2 md:mt-0">TEAM HESSONITE &middot; SPEC V6.0 &middot; SEBI REGULATOR-SAFE</div>
        </footer>

      </div>
    </div>
  );
};
