import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  LayoutDashboard, 
  TrendingUp, 
  BrainCircuit, 
  BarChart3, 
  History, 
  Key, 
  Activity,
  BookOpen,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

// --- Sub-Components ---

const NavItem = ({ label, to, icon: Icon, isPublic }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="relative flex items-center h-full group px-3">
      <div className="flex items-center gap-1.5 transition-all duration-200 group-hover:-translate-y-[1px]">
        {Icon && (
          <Icon className={`w-[15px] h-[15px] transition-colors duration-200 ${isActive ? 'text-[var(--finai-cyan)]' : 'text-[var(--finai-text-muted)] group-hover:text-[var(--finai-cyan)]'}`} />
        )}
        <span className={`text-[14px] font-medium transition-colors duration-200 ${isActive ? 'text-[var(--finai-cyan)]' : 'text-[var(--finai-text-secondary)] group-hover:text-white'}`}>
          {label}
        </span>
      </div>
      
      {/* Active Indicator */}
      <div 
        className={`absolute bottom-0 left-0 h-[2px] bg-[var(--finai-cyan)] transition-all duration-300 ease-out shadow-[0_0_12px_rgba(0,217,255,0.4)] ${isActive ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-50'}`} 
      />
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-[var(--finai-cyan)]/20 blur-[12px] pointer-events-none rounded-full" />
      )}
    </Link>
  );
};

const MarketStatus = () => {
  const tradingContext = useTrading();
  const marketStatus = tradingContext?.marketStatus;
  const [isOpen, setIsOpen] = useState(false);
  
  let timeStr = '--:--:--';
  if (marketStatus?.timestamp) {
    const d = new Date(marketStatus.timestamp);
    timeStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
  }

  return (
    <div className="relative h-full flex items-center border-r border-[var(--finai-border)]">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[var(--finai-surface-elevated)] transition-colors h-full">
        <span className={`w-1.5 h-1.5 rounded-full ${marketStatus?.is_open ? 'bg-[var(--finai-green)] animate-pulse shadow-[0_0_6px_rgba(0,230,168,0.5)]' : 'bg-[var(--finai-amber)]'}`} />
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${marketStatus?.is_open ? 'text-[var(--finai-green)]' : 'text-[var(--finai-amber)]'}`}>
          {marketStatus?.is_open ? 'NSE LIVE' : 'NSE CLOSED'}
        </span>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-[var(--finai-surface-elevated)] border border-[var(--finai-border)] rounded-md shadow-2xl z-50">
            <div className="text-xs font-bold text-white mb-3 tracking-widest flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${marketStatus?.is_open ? 'bg-[var(--finai-green)]' : 'bg-[var(--finai-amber)]'}`} />
              NSE MARKET STATUS
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-[var(--finai-text-muted)]">Exchange</span>
              <span className="text-[11px] font-mono font-semibold text-white">NSE</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-[var(--finai-text-muted)]">Session</span>
              <span className="text-[11px] font-mono font-semibold text-[var(--finai-cyan)]">{marketStatus?.session || 'REGULAR'}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-[var(--finai-text-muted)]">Time (IST)</span>
              <span className="text-[11px] font-mono text-white">{timeStr}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-mono text-[var(--finai-text-muted)]">Data</span>
              <span className="text-[11px] font-mono font-semibold text-[var(--finai-amber)]">{marketStatus?.source || 'LIVE'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AMOStatus = () => (
  <div className="group relative flex flex-col items-end px-3 py-1 border-r border-[var(--finai-border)] cursor-default">
    <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--finai-amber)] uppercase leading-none mb-0.5">AMO</span>
    <span className="text-[11px] font-mono font-semibold text-[var(--finai-text-secondary)] leading-none">09:15 AM</span>
    
    <div className="absolute top-full right-0 mt-2 w-48 p-3 bg-[var(--finai-surface-elevated)] border border-[var(--finai-border)] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-2xl z-50">
      <div className="text-xs font-semibold text-white mb-1">After Market Order</div>
      <div className="text-[10px] text-[var(--finai-text-muted)]">Next execution window at 09:15 AM IST.</div>
    </div>
  </div>
);

const TelemetryModule = ({ label, value }) => (
  <div className="flex flex-col px-3 justify-center h-full border-r border-[var(--finai-border)] last:border-0">
    <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--finai-text-muted)] uppercase leading-none mb-0.5">{label}</span>
    <span className="text-[12px] font-mono font-semibold text-[var(--finai-text)] leading-none">{value}</span>
  </div>
);

const GuestTrader = () => {
  const authContext = useAuth();
  const tradingContext = useTrading();
  const user = authContext?.user;
  const isDemoMode = tradingContext?.isDemoMode;
  const exitDemo = tradingContext?.exitDemo;
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative flex items-center h-full px-3">
      <button onClick={() => setIsOpen(!isOpen)} className="flex flex-col items-end hover:opacity-80 transition-opacity text-right">
        <span className="text-[10px] font-mono text-white font-semibold leading-tight">{user?.username || 'Guest Trader'}</span>
        <span className="text-[9px] font-mono text-[var(--finai-text-muted)] leading-tight">{isDemoMode ? 'Demo Account' : (user?.user_id || 'usr_guest')}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-3 w-56 p-4 bg-[var(--finai-surface-elevated)] border border-[var(--finai-border)] rounded-md shadow-2xl z-50">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">{user?.username || 'Guest Trader'}</div>
            <div className="text-[10px] font-mono text-[var(--finai-text-muted)] mb-4">{isDemoMode ? 'Educational Paper Trading' : 'Active Account'}</div>
            
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--finai-border)]">
              <span className="text-[10px] font-mono text-[var(--finai-text-muted)]">Capital</span>
              <span className="text-[11px] font-mono font-bold text-white">₹1,00,000</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { setIsOpen(false); navigate('/terminal'); }} 
                className="w-full text-center py-2 bg-[var(--finai-cyan)]/10 text-[var(--finai-cyan)] text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--finai-cyan)]/20 transition-colors rounded-sm"
              >
                Open Terminal
              </button>
              {isDemoMode && (
                <button 
                  onClick={() => { if(exitDemo) exitDemo(); setIsOpen(false); navigate('/'); }} 
                  className="w-full text-center py-2 bg-[var(--finai-amber)]/10 text-[var(--finai-amber)] text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--finai-amber)]/20 transition-colors rounded-sm"
                >
                  Exit Demo
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const RunDemoButton = () => {
  const tradingContext = useTrading();
  const navigate = useNavigate();

  useEffect(() => {
    if (tradingContext?.demoInitializationState === 'ACTIVE') {
      navigate('/terminal');
    }
  }, [tradingContext?.demoInitializationState, navigate]);

  if (tradingContext?.isDemoMode) return null;

  const isInitializing = tradingContext?.demoInitializationState === 'INITIALIZING';

  return (
    <button 
      onClick={() => !isInitializing && tradingContext?.seedDemoData()} 
      disabled={isInitializing}
      className={`text-[10px] font-mono font-bold tracking-widest border px-3 py-1.5 uppercase transition-colors rounded-sm ml-3 shrink-0 ${
        isInitializing 
          ? 'text-[var(--finai-cyan)] border-[var(--finai-cyan)]/30 bg-[var(--finai-cyan)]/10 animate-pulse cursor-wait' 
          : 'text-[var(--finai-amber)] border-[var(--finai-amber)]/30 bg-[var(--finai-amber)]/10 hover:bg-[var(--finai-amber)]/20'
      }`}
    >
      {isInitializing ? 'INITIALIZING...' : 'Run Demo'}
    </button>
  );
};

// --- Main Component ---

export const FinAINavigation = ({ mode = "app" }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  
  // Safely grab context (will be populated if inside TradingProvider)
  const tradingContext = useTrading();
  const authContext = useAuth();
  
  const portfolio = tradingContext?.portfolio || { cash_balance: 100000, total_value: 100000 };
  const user = authContext?.user;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isPublic = mode === "public";
  
  // Navigation structure definition
  const publicNav = [
    { label: 'Platform', to: '/platform' },
    { label: 'Intelligence', to: '/intelligence' },
    { label: 'Terminal', to: '/terminal' },
    { label: 'Research', to: '/research' },
  ];

  const appNav = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, group: 'core' },
    { label: 'Terminal', to: '/terminal', icon: TrendingUp, group: 'core' },
    { label: 'Intelligence', to: '/intelligence', icon: BrainCircuit, group: 'intel' },
    { label: 'Scorecard', to: '/scorecard', icon: BarChart3, group: 'intel' },
    { label: 'Orders', to: '/orders', icon: History, group: 'exec' },
    { label: 'API Keys', to: '/api-keys', icon: Key, group: 'config' },
  ];

  const activeNav = isPublic ? publicNav : appNav;

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-out`}
        style={{
          height: isPublic ? (scrolled ? '68px' : '84px') : '68px',
          backgroundColor: scrolled || !isPublic ? 'rgba(5,9,18,0.88)' : 'transparent',
          backdropFilter: scrolled || !isPublic ? 'blur(20px)' : 'none',
          borderBottom: scrolled || !isPublic ? '1px solid var(--finai-border)' : '1px solid transparent',
          boxShadow: scrolled || !isPublic ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
        }}
      >
        <div className="w-full max-w-[1500px] px-4 md:px-8 flex items-center justify-between h-full">
          
          {/* Logo Lockup */}
          <Link to="/" className="flex flex-col justify-center shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                FinAI 
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--finai-cyan)] animate-pulse-slow shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--finai-cyan)] mt-0.5 opacity-80">
              {isPublic ? 'QUANT AI' : 'v6'}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center h-full ml-10 flex-1">
            {isPublic ? (
              <div className="flex items-center h-full gap-2">
                {activeNav.map(item => <NavItem key={item.to} {...item} isPublic={isPublic} />)}
              </div>
            ) : (
              <div className="flex items-center h-full">
                {/* Groups */}
                <div className="flex items-center h-full mr-6">
                  {activeNav.filter(n => n.group === 'core').map(item => <NavItem key={item.to} {...item} />)}
                </div>
                <div className="flex items-center h-full mr-6">
                  {activeNav.filter(n => n.group === 'intel').map(item => <NavItem key={item.to} {...item} />)}
                </div>
                <div className="flex items-center h-full mr-6">
                  {activeNav.filter(n => n.group === 'exec').map(item => <NavItem key={item.to} {...item} />)}
                </div>
                <div className="flex items-center h-full">
                  {activeNav.filter(n => n.group === 'config').map(item => <NavItem key={item.to} {...item} />)}
                </div>
              </div>
            )}
          </nav>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-5 shrink-0 h-full py-3">
            
            {/* Search (Public Mode) */}
            {isPublic && (
              <button 
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 text-[var(--finai-text-secondary)] hover:text-white transition-colors group px-2"
              >
                <Search className="w-4 h-4 group-hover:text-[var(--finai-cyan)] transition-colors" />
                <span className="text-sm font-medium">Search FinAI...</span>
                <kbd className="ml-1.5 text-[10px] font-mono bg-[var(--finai-surface)] border border-[var(--finai-border)] px-1.5 py-0.5 rounded text-[var(--finai-text-muted)] group-hover:border-[var(--finai-text-muted)] transition-colors">⌘K</kbd>
              </button>
            )}

            {/* Telemetry (App Mode & Public Mode) */}
            <div className="hidden lg:flex items-center h-full mr-4 bg-[var(--finai-surface)] border border-[var(--finai-border)] rounded-md overflow-hidden">
              <AMOStatus />
              <MarketStatus />
              <TelemetryModule label="Cash" value={formatCurrency(portfolio.cash_balance)} />
              <TelemetryModule label="Portfolio" value={formatCurrency(portfolio.total_value)} />
              <GuestTrader />
              <RunDemoButton />
            </div>

            {/* Auth / CTA / Demo */}
            {isPublic ? (
              <div className="flex items-center gap-4 ml-2 h-full">
                <Link to="/login" className="text-sm font-medium text-[var(--finai-text-secondary)] hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/dashboard"
                  className="group relative border border-[var(--finai-cyan)]/30 bg-[var(--finai-cyan)]/10 px-5 py-2 overflow-hidden transition-all hover:bg-[var(--finai-cyan)]/20 hover:border-[var(--finai-cyan)]/60 shadow-[0_0_15px_rgba(0,217,255,0.05)] hover:shadow-[0_0_20px_rgba(0,217,255,0.15)] rounded-sm"
                >
                  <div className="absolute inset-0 w-0 bg-[var(--finai-cyan)]/10 transition-all duration-300 ease-out group-hover:w-full" />
                  <div className="relative flex items-center gap-2 text-[var(--finai-cyan)] font-mono text-[11px] tracking-widest uppercase font-bold transition-transform duration-200 group-hover:-translate-y-[1px]">
                    Enter FinAI <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-[var(--finai-text-secondary)] hover:text-white p-2"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-[var(--finai-bg)]/95 backdrop-blur-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--finai-border)]">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  FinAI <span className="w-1.5 h-1.5 rounded-full bg-[var(--finai-cyan)]" />
                </span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="text-[var(--finai-text-muted)] hover:text-white p-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
              <nav className="flex flex-col gap-6">
                {!isPublic && ['core', 'intel', 'exec', 'config'].map(group => (
                  <div key={group} className="flex flex-col gap-3">
                    <div className="text-[10px] font-mono text-[var(--finai-text-muted)] uppercase tracking-widest">{group}</div>
                    {appNav.filter(n => n.group === group).map(item => (
                      <Link 
                        key={item.to} 
                        to={item.to} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium text-[var(--finai-text)] hover:text-[var(--finai-cyan)] transition-colors flex items-center gap-3"
                      >
                        <item.icon className="w-5 h-5 text-[var(--finai-text-muted)]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
                {isPublic && (
                  <div className="flex flex-col gap-4">
                    {publicNav.map(item => (
                      <Link 
                        key={item.to} 
                        to={item.to} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-2xl font-medium text-[var(--finai-text)] hover:text-[var(--finai-cyan)] transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </nav>

              <div className="mt-auto flex flex-col gap-4 pt-6 border-t border-[var(--finai-border)]">
                <MarketStatus />
                <TelemetryModule label="Portfolio" value={formatCurrency(portfolio.total_value)} />
                <Link 
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-[var(--finai-cyan)]/10 border border-[var(--finai-cyan)]/30 text-[var(--finai-cyan)] text-center py-3 font-mono text-sm tracking-widest font-bold uppercase rounded-sm"
                >
                  Enter FinAI →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowSearch(false)}
              className="absolute inset-0 bg-[var(--finai-bg)]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl bg-[var(--finai-surface)] border border-[var(--finai-border)] shadow-2xl rounded-xl overflow-hidden mx-4"
            >
              <div className="flex items-center px-4 border-b border-[var(--finai-border)] bg-[var(--finai-surface-elevated)]">
                <Search className="w-5 h-5 text-[var(--finai-cyan)]" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search intelligence, symbols, or commands..." 
                  className="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none focus:ring-0 placeholder:text-[var(--finai-text-muted)] text-lg"
                />
                <div className="text-[10px] font-mono text-[var(--finai-text-muted)] bg-[var(--finai-bg)] px-2 py-1 rounded border border-[var(--finai-border)]">ESC</div>
              </div>
              
              <div className="p-4 bg-[var(--finai-bg)]">
                <div className="text-[10px] font-mono text-[var(--finai-text-muted)] uppercase tracking-widest mb-3 px-2">Navigation</div>
                <div className="space-y-1 mb-4">
                  {[
                    { label: "Dashboard", to: "/dashboard" },
                    { label: "Terminal", to: "/terminal" },
                    { label: "Intelligence", to: "/intelligence" },
                  ].map((cmd, i) => (
                    <button 
                      key={i}
                      onClick={() => { setShowSearch(false); navigate(cmd.to); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-[var(--finai-text-secondary)] hover:text-white hover:bg-[var(--finai-surface)] rounded-md transition-colors"
                    >
                      {cmd.label}
                      <span className="text-[10px] font-mono text-[var(--finai-text-muted)]">JUMP</span>
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-[var(--finai-text-muted)] uppercase tracking-widest mb-3 px-2">Research</div>
                <div className="space-y-1">
                  {[
                    { label: "Search stocks", icon: Activity, to: "/terminal" },
                    { label: "Search strategies", icon: BrainCircuit, to: "/intelligence" },
                  ].map((cmd, i) => (
                    <button 
                      key={i}
                      onClick={() => { setShowSearch(false); navigate(cmd.to); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[var(--finai-text-secondary)] hover:text-white hover:bg-[var(--finai-surface)] rounded-md transition-colors group"
                    >
                      <cmd.icon className="w-4 h-4 text-[var(--finai-text-muted)] group-hover:text-[var(--finai-cyan)] transition-colors" />
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
