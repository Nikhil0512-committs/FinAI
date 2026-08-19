import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import { 
  TrendingUp, 
  BarChart3, 
  Zap, 
  History, 
  Settings, 
  ShieldCheck, 
  BrainCircuit, 
  CheckCircle2, 
  Timer,
  Play,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Layout = ({ children }) => {
  const { 
    portfolio, 
    tradeCount, 
    profileUnlocked, 
    coolingOffTimer, 
    seedDemoData 
  } = useTrading();

  const formatRupee = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/terminal', label: 'Terminal', icon: TrendingUp },
    { path: '/intelligence', label: 'Intelligence', icon: BarChart3 },
    { path: '/scorecard', label: 'Scorecard', icon: Zap },
    { path: '/orders', label: 'Orders', icon: History },
    { path: '/api-keys', label: 'API', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* ─── Premium Command Navigation ─── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 bg-[#000000]/60 backdrop-blur-2xl border-b border-gray-900/80 px-6 py-3"
      >
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded flex items-center justify-center bg-[#050811] border border-gray-800 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <BrainCircuit className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold tracking-tight text-white font-sans leading-none">
                FinAI
              </span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                OS v6.0
              </span>
            </div>
          </div>

          {/* Navigation System */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-[12px] font-medium font-sans transition-all duration-300 flex items-center gap-2 group ${
                      isActive
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{item.label}</span>
                      
                      {/* Active State Illumination */}
                      {isActive && (
                        <motion.div
                          layoutId="navGlow"
                          className="absolute inset-0 z-0 bg-gradient-to-b from-cyan-900/10 to-transparent rounded-md"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="navLine"
                          className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}

                      {/* Hover Sweep */}
                      {!isActive && (
                        <div className="absolute inset-0 z-0 bg-gray-800/0 group-hover:bg-gray-800/30 rounded-md transition-colors duration-300" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Section: System Metrics */}
          <div className="flex items-center gap-4">
            
            {/* Cooling Off Indicator */}
            {coolingOffTimer !== null && coolingOffTimer > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-950/20 border border-amber-900/50 px-2.5 py-1 rounded text-amber-400 font-mono text-[10px] uppercase tracking-wider animate-pulse">
                <Timer className="h-3 w-3" />
                <span>Cooling: {formatTimer(coolingOffTimer)}</span>
              </div>
            )}

            {/* System Status Indicators */}
            <div className="hidden xl:flex items-center gap-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-r border-gray-800/60 pr-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>SEBI</span>
              </div>
              <div className="flex items-center gap-1.5">
                {profileUnlocked ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Lock className="h-3 w-3 text-cyan-400" />
                )}
                <span className={profileUnlocked ? 'text-emerald-400' : 'text-cyan-400'}>
                  XAI {tradeCount}/6
                </span>
              </div>
            </div>

            {/* Portfolio Value */}
            <div className="flex flex-col items-end">
              <div className="text-[9px] uppercase font-mono text-gray-500 tracking-widest">Net Value</div>
              <div className="font-mono font-medium text-[13px] text-white tracking-tight">
                {formatRupee(portfolio.total_value)}
              </div>
            </div>

            {/* Demo Button */}
            <button
              onClick={seedDemoData}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded transition-all flex items-center gap-1.5 ml-2"
            >
              <Play className="h-3 w-3" />
              <span className="hidden md:inline">Demo</span>
            </button>

          </div>
        </div>
      </motion.header>

      {/* Main Page Area */}
      <main className="flex-1 w-full mx-auto relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#000000] border-t border-gray-900 py-6 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
        <div className="max-w-[1800px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>Paper-Trading Simulator &middot; Zero real funds at risk</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Data Engine Active</span>
            <span>&middot;</span>
            <span>Deterministic XAI</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
