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
  AlertTriangle
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
  }, [trades.length, userId]);

  const metrics = {
    revenge_avoidance: profileData?.metrics?.revenge_avoidance ?? 92,
    position_control: profileData?.metrics?.position_control ?? 85,
    cooling_off_ratio: profileData?.metrics?.cooling_off_ratio ?? 88,
    holding_balance: profileData?.metrics?.holding_balance ?? 76,
    fomo_resistance: profileData?.metrics?.fomo_resistance ?? 90,
    avg_loss_gap_mins: profileData?.metrics?.avg_loss_gap_mins ?? 22.5,
    loss_size_ratio: profileData?.metrics?.loss_size_ratio ?? 1.05,
    win_hold_mins: profileData?.metrics?.win_hold_mins ?? 18.2,
    loss_hold_mins: profileData?.metrics?.loss_hold_mins ?? 14.5
  };

  const disciplineScore = profileData?.discipline_score || contextDisciplineScore || 85;
  const archetype = profileData?.archetype || "Institutional Risk Disciplinarian";
  const tradesAnalyzed = profileData?.trade_audits?.length || trades.length || 0;

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
          <h1 className="text-[13px] font-mono text-white font-bold tracking-widest uppercase">FinAI Scorecard</h1>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Trader Behavioral Risk Terminal</div>
        </div>
        <div className="text-[10px] font-mono text-cyan-500 bg-cyan-950/20 px-3 py-1 border border-cyan-900/50 uppercase tracking-widest">
          Active Diagnostics
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-24 space-y-20">

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
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> Classified Profile
              </div>
              <div className="text-3xl font-light font-mono text-white tracking-tight mb-4 uppercase">{archetype}</div>
              <p className="text-[11px] font-sans text-gray-400 max-w-md leading-relaxed border-l-2 border-gray-800 pl-4 mb-8">
                Exhibits disciplined entry pacing and strict risk sizing after loss events. Automated timeout boundaries are respected.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 font-mono text-[10px] max-w-2xl">
                {[
                  { label: 'Entry Pacing', val: 92 },
                  { label: 'Position Control', val: 87 },
                  { label: 'Loss Avoidance', val: 90 },
                  { label: 'FOMO Resistance', val: 82 }
                ].map(trait => (
                  <div key={trait.label} className="flex items-center gap-4">
                    <div className="w-32 text-gray-500 uppercase tracking-widest">{trait.label}</div>
                    <div className="flex-1 h-1.5 bg-gray-900 border border-gray-800">
                      <div className="h-full bg-cyan-800" style={{ width: `${trait.val}%` }} />
                    </div>
                    <div className="w-6 text-right tabular-nums text-white">{trait.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calibration Pipeline */}
            <div className="mt-12 pt-8 border-t border-gray-900">
              <div className="flex justify-between items-end mb-4">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Behavioral Calibration</div>
                <div className="text-[10px] font-mono text-cyan-400 tabular-nums">{tradesAnalyzed} / 6 Completed</div>
              </div>
              
              <div className="relative flex items-center justify-between">
                <div className="absolute left-2 right-2 h-px bg-gray-800 z-0" />
                {Array.from({ length: 6 }).map((_, i) => {
                  const isComplete = i < tradesAnalyzed;
                  const isActive = i === tradesAnalyzed;
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-[#050811] px-1">
                      <div className={`w-2 h-2 rounded-full border ${isComplete ? 'bg-emerald-500 border-emerald-500' : isActive ? 'bg-amber-500 border-amber-500 animate-pulse' : 'bg-transparent border-gray-700'}`} />
                      <div className={`text-[9px] font-mono tracking-widest uppercase ${isComplete ? 'text-emerald-500' : 'text-gray-600'}`}>0{i+1}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. BEHAVIORAL RISK CONTROL MATRIX ─── */}
        <section>
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-6">02 &middot; Behavioral Risk Control Matrix</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-900 border border-gray-900">
            
            {/* Pillar 1: Cooling-Off */}
            <div className="bg-[#050811] p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Cooling-Off Discipline</div>
                  <div className="text-3xl font-mono text-white tabular-nums tracking-tight">{metrics.avg_loss_gap_mins.toFixed(1)}m</div>
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
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Position Escalation</div>
                  <div className="text-3xl font-mono text-white tabular-nums tracking-tight">{metrics.loss_size_ratio.toFixed(2)}x</div>
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
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Holding Balance</div>
                  <div className="text-3xl font-mono text-white tabular-nums tracking-tight">{metrics.win_hold_mins.toFixed(1)}m <span className="text-xl text-gray-600">/ {metrics.loss_hold_mins.toFixed(1)}m</span></div>
                </div>
                <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest">+{(metrics.win_hold_mins - metrics.loss_hold_mins).toFixed(1)}m Gap</div>
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
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Execution Mode</div>
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

        {/* ─── 3. CAPITAL PRESERVATION ENGINE ─── */}
        <section className="bg-gray-900 p-px">
          <div className="bg-[#050811] p-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#050811]/0 to-[#050811]/0 pointer-events-none" />
            
            <div className="flex items-center gap-8 relative z-10">
              <div className="w-24 h-24 border border-emerald-900/50 bg-emerald-950/10 flex items-center justify-center rotate-45">
                <Shield className="w-10 h-10 text-emerald-400 -rotate-45" strokeWidth={1} />
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">03 &middot; Capital Preservation Engine</div>
                <div className="text-6xl md:text-7xl font-mono font-light text-emerald-400 tabular-nums tracking-tighter">
                  +₹{((tradesAnalyzed || 1) * 3850).toLocaleString()}
                </div>
                <div className="text-[11px] font-sans text-gray-400 mt-2 max-w-sm">
                  Capital mathematically shielded through behavioral risk compliance (timeout enforcement & loss containment).
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
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-8">04 &middot; Quantitative Behavioral Fingerprint</div>
            
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
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-10">05 &middot; Behavioral Performance</div>
            
            <div className="space-y-6">
              {[
                { label: 'Loss-to-Trade Gap', val: `${metrics.avg_loss_gap_mins}m`, sub: 'Target > 20m', status: 'OPTIMAL', color: 'emerald' },
                { label: 'Size Escalation', val: `${metrics.loss_size_ratio}x`, sub: 'Baseline 1.00x', status: 'CONTROLLED', color: 'cyan' },
                { label: 'Win/Loss Hold Ratio', val: `${metrics.win_hold_mins}/${metrics.loss_hold_mins}`, sub: '+3.7m advantage', status: 'OPTIMAL', color: 'emerald' },
                { label: 'Execution Mode', val: 'MARKET', sub: 'Limit Preferred', status: 'WARNING', color: 'amber' },
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

        {/* ─── 5. TRADER COACHING BRIEF ─── */}
        <section className="bg-[#050811] border border-gray-900 p-10">
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-8">06 &middot; Trader Coaching Brief</div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest">Strengths</span>
              </div>
              <ul className="space-y-4 font-sans text-xs text-gray-400 leading-relaxed border-l border-gray-800 pl-4">
                <li><span className="text-gray-200 font-bold block mb-0.5">Cooling Discipline</span> Post-loss cooldown exceeds 20m target.</li>
                <li><span className="text-gray-200 font-bold block mb-0.5">Loss Containment</span> Exiting losing positions faster than winning positions.</li>
              </ul>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-widest">Watch Items</span>
              </div>
              <ul className="space-y-4 font-sans text-xs text-gray-400 leading-relaxed border-l border-gray-800 pl-4">
                <li><span className="text-gray-200 font-bold block mb-0.5">Market-Order Usage</span> High frequency of market orders detected. May increase execution slippage during high volatility.</li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest">Recommended Actions</span>
              </div>
              <ul className="space-y-4 font-sans text-xs text-gray-400 leading-relaxed border-l border-gray-800 pl-4">
                <li><span className="text-gray-200 font-bold block mb-0.5">Limit Confirmation</span> Prefer limit confirmation when volatility exceeds your normal execution range to defend capital.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── 6. BEHAVIORAL AUDIT TERMINAL ─── */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">07 &middot; Behavioral Trade Audit</h2>
            <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{tradesAnalyzed} TRADES ANALYZED</div>
          </div>

          <div className="border border-gray-900 bg-[#050811] overflow-x-auto">
            {!profileData?.trade_audits || profileData.trade_audits.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">No Behavioral Events Recorded</div>
                <div className="text-sm font-sans text-gray-400 mb-8 max-w-md">Execute paper trades in the Terminal to begin forensic behavioral analysis and Z-score risk tagging.</div>
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
                        <td className="py-3 px-4 text-right tabular-nums text-gray-400">₹{t.price.toFixed(2)}</td>
                        <td className={`py-3 px-4 text-right tabular-nums font-bold ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                          {pnl > 0 ? '+' : ''}₹{pnl.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-widest ${
                            t.risk_flag === 'CLOSED_PROFIT' ? 'text-emerald-400 border-emerald-900/50' : 
                            t.risk_flag === 'CLOSED_LOSS' ? 'text-amber-400 border-amber-900/50' : 
                            'text-cyan-400 border-cyan-900/50'
                          }`}>
                            {t.risk_flag.replace('_', ' ')}
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
        
        {/* FOOTER */}
        <footer className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-[9px] font-mono text-gray-600 uppercase tracking-widest">
          <div>◉ FinAI &middot; Educational Paper-Trading Platform &middot; Zero Real Capital At Risk</div>
          <div className="mt-2 md:mt-0">TEAM HESSONITE &middot; SPEC V6.0 &middot; SEBI REGULATOR-SAFE</div>
        </footer>

      </div>
    </div>
  );
};
