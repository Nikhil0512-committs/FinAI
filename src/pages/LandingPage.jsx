import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import { 
  ArrowRight, ShieldCheck, Activity, BarChart3, 
  BrainCircuit, History, Zap, TrendingUp, LayoutDashboard 
} from 'lucide-react';

// --- Shared Components ---

const DataPanel = ({ title, value, subtext, color, style }) => (
  <motion.div 
    className="absolute bg-[#050914]/80 backdrop-blur-md border border-[#1e2532] p-3 text-[10px] font-mono uppercase tracking-widest pointer-events-none"
    style={{ ...style }}
  >
    <div className="text-gray-500 mb-1">{title}</div>
    <div className={`text-${color}-400 font-bold mb-0.5`}>{value}</div>
    {subtext && <div className="text-gray-400">{subtext}</div>}
  </motion.div>
);

// --- 1. Cinematic Hero ---

const CinematicHero = () => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Safe extraction of telemetry data
  let marketStatus = { session: 'SIMULATED', is_open: false };
  let signal = 'NEUTRAL 50%';
  let risk = 'MODERATE';
  let sentiment = '50 / 100';
  let sentimentTag = 'NEUTRAL';
  let signalColor = 'gray';
  let riskColor = 'amber';
  
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tradingContext = useTrading();
    if (tradingContext) {
      if (tradingContext.marketStatus) marketStatus = tradingContext.marketStatus;
      
      const pnl = tradingContext.portfolio?.total_pnl || 0;
      if (pnl > 500) {
        signal = 'BULLISH 88.1%'; signalColor = 'emerald';
        risk = 'LOW'; riskColor = 'emerald';
        sentiment = '74 / 100'; sentimentTag = 'POSITIVE';
      } else if (pnl < -500) {
        signal = 'BEARISH 76.4%'; signalColor = 'rose';
        risk = 'HIGH'; riskColor = 'rose';
        sentiment = '22 / 100'; sentimentTag = 'NEGATIVE';
      }
    }
  } catch (e) {
    // Fail silently, use fallbacks
  }

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-screen flex items-center justify-between px-6 lg:px-24 overflow-hidden pt-20"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(0,229,255,0.05),_transparent_60%)]" />

      {/* Left Typography */}
      <div className="relative z-10 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-[100px] font-bold leading-[0.9] tracking-tighter text-white">
            TURN MARKET <br />
            <span className="text-gray-500">NOISE</span> <br />
            INTO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              INTELLIGENCE.
            </span>
          </h1>
          
          <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Link to="/dashboard" className="group relative border border-cyan-500/50 bg-cyan-950/30 px-8 py-4 overflow-hidden transition-all hover:bg-cyan-900/50 hover:border-cyan-400">
              <div className="absolute inset-0 w-0 bg-cyan-500/10 transition-all duration-300 ease-out group-hover:w-full" />
              <div className="relative flex items-center gap-3 text-cyan-50 font-mono text-sm tracking-widest uppercase font-bold">
                Enter FinAI <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Educational Platform</span>
              <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" /> Zero Real Capital at Risk
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right 3D Intelligence Core */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none hidden lg:block">
        <motion.div 
          className="relative w-full h-full"
          style={{
            perspective: 1200,
            rotateX: mousePos.y * 20,
            rotateY: mousePos.x * -20,
            transition: 'transform 0.2s ease-out'
          }}
        >
          {/* Core Sphere */}
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-cyan-500/30 bg-[#050914]/80 backdrop-blur-md shadow-[0_0_100px_rgba(0,229,255,0.1)] flex items-center justify-center"
            animate={{ rotateZ: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-48 h-48 rounded-full border border-dashed border-cyan-500/40" />
            <div className="absolute w-32 h-32 rounded-full border border-emerald-500/20" />
          </motion.div>

          {/* Orbiting Rings */}
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#1e2532]"
            style={{ rotateX: 60, rotateY: 20 }}
            animate={{ rotateZ: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#1e2532]/50"
            style={{ rotateX: 70, rotateY: -30 }}
            animate={{ rotateZ: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Floating Data Panels */}
          <DataPanel 
            title="MARKET SIGNAL" 
            value={signal} 
            color={signalColor} 
            style={{ top: '25%', left: '10%' }} 
          />
          <DataPanel 
            title="SENTIMENT" 
            value={sentiment} 
            subtext={sentimentTag}
            color="cyan" 
            style={{ top: '65%', left: '70%' }} 
          />
          <DataPanel 
            title="RISK" 
            value={risk} 
            color={riskColor} 
            style={{ top: '75%', left: '15%' }} 
          />
          <DataPanel 
            title="STATUS" 
            value={marketStatus?.is_open ? 'LIVE MARKET' : 'DEMO SIMULATION'} 
            color="gray" 
            style={{ top: '20%', left: '60%' }} 
          />
        </motion.div>
      </div>
    </section>
  );
};

// --- 2. Live Market Tape ---

const LiveMarketTape = () => {
  const navigate = useNavigate();
  const { stockList = [], setSelectedStock, marketStatus } = useTrading();
  const [analyzingSymbol, setAnalyzingSymbol] = useState(null);

  // Duplicating stock list heavily to ensure seamless infinite scroll on wide displays
  const displayStocks = [...stockList, ...stockList, ...stockList, ...stockList, ...stockList, ...stockList];

  const handleStockClick = (symbol) => {
    setAnalyzingSymbol(symbol);
    setTimeout(() => {
      setSelectedStock(symbol);
      navigate('/intelligence');
    }, 450); // Cinematic transition delay
  };

  return (
    <div className="w-full border-y border-[#1e2532] bg-[#000000] py-1.5 overflow-hidden relative">
      
      {/* Tape Wrapper with CSS Animation */}
      <div className="flex items-center w-max animate-tape-scroll hover:[animation-play-state:paused]">
        
        {/* Market Status Anchor */}
        <div className="flex items-center gap-2 px-8 border-r border-[#1e2532] shrink-0">
          <span className={`w-2 h-2 rounded-full ${marketStatus?.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            {marketStatus?.is_open ? 'NSE LIVE' : 'DEMO SIMULATION'}
          </span>
        </div>

        {displayStocks.map((stock, i) => {
          const isBullish = stock.change_pct >= 0;
          return (
            <div 
              key={`${stock.symbol}-${i}`}
              onClick={() => handleStockClick(stock.symbol)}
              className="relative flex items-center gap-6 px-8 border-r border-[#1e2532] shrink-0 cursor-pointer transition-colors duration-300 hover:bg-cyan-950/20 group h-12"
            >
              <span className="text-sm font-mono font-medium text-white group-hover:text-cyan-400 transition-colors">
                {stock.symbol}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-300">
                  ₹{stock.price?.toFixed(2) || '---'}
                </span>
                <span className={`text-[11px] font-mono ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isBullish ? '+' : ''}{stock.change_pct?.toFixed(2) || '0.00'}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Analyzing Transition Overlay */}
      <AnimatePresence>
        {analyzingSymbol && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#000000]/95 backdrop-blur-sm flex items-center justify-center border-y border-cyan-500/50"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-cyan-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-cyan-400 tracking-widest uppercase">
                ANALYZING {analyzingSymbol}...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 3. Market Chaos to Order ---

const SignalTransformation = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.25], [0, 1]);
  
  const signals = ['PRICE', 'VOLUME', 'SENTIMENT', 'FLOW', 'MOMENTUM', 'VOLATILITY', 'BEHAVIOR'];
  const [activeSignal, setActiveSignal] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSignal(current => (current + 1) % signals.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [signals.length]);

  return (
    <section className="min-h-screen flex flex-col relative overflow-hidden bg-[#050914] pt-24">
      <motion.div style={{ opacity, y }} className="text-center max-w-4xl px-6 flex-1 flex flex-col justify-center mx-auto w-full">
        
        <h2 className="text-3xl md:text-6xl font-bold tracking-tighter leading-tight text-white mb-8">
          THE MARKET <motion.span initial={{opacity: 0, filter: 'blur(4px)'}} whileInView={{opacity: 1, filter: 'blur(0px)'}} transition={{delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1]}} viewport={{once: true}}>DOESN'T </motion.span><br/> 
          <motion.span initial={{opacity: 0, filter: 'blur(4px)', y: 5}} whileInView={{opacity: 1, filter: 'blur(0px)', y: 0}} transition={{delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1]}} viewport={{once: true}} className="text-gray-600">GIVE YOU ANSWERS.</motion.span>
        </h2>
        
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1e2532] to-transparent my-8" />
        
        <motion.h2 
          initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.99 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="text-3xl md:text-6xl font-bold tracking-tighter leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 drop-shadow-[0_0_15px_rgba(0,229,255,0.3)]"
        >
          IT GIVES YOU SIGNALS.
        </motion.h2>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-4 text-[10px] font-mono tracking-widest uppercase mb-16"
        >
          {signals.map((sig, i) => {
            const isActive = i === activeSignal;
            return (
              <div 
                key={sig}
                className={`px-4 py-2 border transition-all duration-300 ${
                  isActive 
                    ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.15)] scale-105' 
                    : 'border-[#1e2532] bg-[#0B1222] text-gray-500 scale-100'
                }`}
              >
                {isActive ? `[ ${sig} ]` : sig}
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Completely independent persistent stock ticker at the bottom of the section */}
      <div className="w-full mt-auto">
        <LiveMarketTape />
      </div>
    </section>
  );
};

// --- 3. Intelligence Engine ---

const IntelligenceEngine = () => {
  return (
    <section className="py-32 px-6 lg:px-24 border-t border-[#1e2532]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white">
            ONE MARKET.<br/>
            MULTIPLE SIGNALS.<br/>
            <span className="text-cyan-400">ONE INTELLIGENCE LAYER.</span>
          </h2>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 flex justify-center opacity-20 pointer-events-none">
            <svg viewBox="0 0 800 400" className="w-full max-w-4xl h-full">
              <path d="M400 350 L400 200" stroke="#00E5FF" strokeWidth="2" fill="none" strokeDasharray="4 4" />
              <path d="M400 200 L200 100" stroke="#00E5FF" strokeWidth="2" fill="none" />
              <path d="M400 200 L400 100" stroke="#00E5FF" strokeWidth="2" fill="none" />
              <path d="M400 200 L600 100" stroke="#00E5FF" strokeWidth="2" fill="none" />
            </svg>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-24 w-full relative z-10 mt-12 mb-32">
            {[
              { title: "TECHNICAL", icon: Activity, desc: "Trend, momentum and volatility signals." },
              { title: "NEWS", icon: BrainCircuit, desc: "RAG-grounded financial context." },
              { title: "BEHAVIOR", icon: Zap, desc: "Quantitative trading-discipline analysis." }
            ].map((node, i) => (
              <motion.div 
                key={node.title}
                whileHover={{ y: -5, borderColor: '#00E5FF' }}
                className="w-64 p-6 border border-[#1e2532] bg-[#0B1222] flex flex-col items-center text-center transition-colors cursor-pointer group"
              >
                <node.icon className="w-8 h-8 text-gray-500 mb-4 group-hover:text-cyan-400 transition-colors" />
                <h3 className="text-xs font-mono font-bold tracking-widest text-white mb-2">{node.title}</h3>
                <p className="text-[11px] text-gray-400 font-sans leading-relaxed">{node.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 px-12 py-6 border border-cyan-900 bg-cyan-950/20 shadow-[0_0_40px_rgba(0,229,255,0.1)]">
            <h3 className="text-sm font-mono font-bold tracking-[0.2em] text-cyan-400">FINAI INTELLIGENCE</h3>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- 4. Product Ecosystem (Holographic Previews) ---

const HolographicPreview = ({ title, desc, icon: Icon, align = 'left', children }) => {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 py-24`}>
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 text-cyan-400">
          <Icon className="w-6 h-6" />
          <h3 className="text-[13px] font-mono font-bold tracking-[2px] uppercase">{title}</h3>
        </div>
        <p className="text-2xl md:text-4xl font-bold tracking-tight text-white leading-tight">
          {desc}
        </p>
      </div>
      <div className="flex-1 w-full flex justify-center">
        <div className="relative w-full max-w-lg aspect-video" style={{ perspective: 1000 }}>
          <motion.div 
            initial={{ rotateX: 20, rotateY: align === 'left' ? -20 : 20, opacity: 0, y: 50 }}
            whileInView={{ rotateX: 10, rotateY: align === 'left' ? -10 : 10, opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full h-full border border-[#1e2532] bg-[#0B1222] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Fake Mac Header */}
            <div className="h-6 border-b border-[#1e2532] bg-[#050914] flex items-center px-3 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-700" />
              <div className="w-2 h-2 rounded-full bg-gray-700" />
              <div className="w-2 h-2 rounded-full bg-gray-700" />
            </div>
            {/* Preview Content */}
            <div className="flex-1 p-4 relative overflow-hidden">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ProductEcosystem = () => {
  return (
    <section className="py-32 px-6 lg:px-24 bg-[#0B1222]/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-32">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tighter text-white">
            FROM FIRST SIGNAL <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-100">TO FINAL DECISION.</span>
          </h2>
        </div>

        <HolographicPreview title="01 Dashboard" desc="See your financial world at a glance." icon={LayoutDashboard} align="left">
          <div className="grid grid-cols-3 gap-3 h-full">
            <div className="col-span-2 border border-[#1e2532] bg-[#050914] p-3 flex flex-col justify-end">
               <div className="w-full h-1/2 border-b border-dashed border-gray-800" />
               <div className="w-full h-8 bg-gradient-to-t from-emerald-500/20 to-transparent border-t border-emerald-500 mt-auto" />
            </div>
            <div className="col-span-1 border border-[#1e2532] bg-[#050914] p-3" />
            <div className="col-span-1 border border-[#1e2532] bg-[#050914] p-3" />
            <div className="col-span-2 border border-[#1e2532] bg-[#050914] p-3" />
          </div>
        </HolographicPreview>

        <HolographicPreview title="02 Terminal" desc="Analyze markets with precision." icon={TrendingUp} align="right">
          <div className="flex flex-col h-full gap-3">
             <div className="flex-1 border border-[#1e2532] bg-[#050914] p-4 flex gap-1 items-end">
               {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                 <div key={i} className="w-6 bg-emerald-500/50 border border-emerald-400" style={{ height: `${h}%` }} />
               ))}
             </div>
          </div>
        </HolographicPreview>

        <HolographicPreview title="03 Intelligence" desc="Understand why the market is moving." icon={BrainCircuit} align="left">
           <div className="h-full border border-cyan-900/50 bg-cyan-950/20 p-4 flex flex-col justify-center items-center text-center">
             <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-2">AI Market Thesis</div>
             <div className="text-3xl font-bold text-emerald-400 mb-2">BULLISH</div>
             <div className="text-xs font-mono text-gray-400">88.1% CONFIDENCE</div>
             <div className="mt-4 px-2 py-1 bg-amber-950/50 text-amber-500 border border-amber-900/50 text-[9px] font-mono">DEMO ANALYSIS</div>
           </div>
        </HolographicPreview>
        
        <HolographicPreview title="04 Scorecard" desc="Measure the trader behind the trades." icon={BarChart3} align="right">
           <div className="h-full border border-[#1e2532] bg-[#050914] p-4 flex justify-center items-center">
             {/* Fake Radar */}
             <div className="relative w-32 h-32 rounded-full border border-[#1e2532] flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full border border-[#1e2532]" />
                <div className="absolute w-16 h-16 rounded-full border border-[#1e2532]" />
                <svg className="absolute inset-0 w-full h-full">
                  <polygon points="64,16 96,48 80,96 48,112 16,80 32,32" fill="rgba(0,229,255,0.2)" stroke="#00E5FF" strokeWidth="1"/>
                </svg>
             </div>
           </div>
        </HolographicPreview>

      </div>
    </section>
  );
};

// --- 5. Paper Trading ---

const PaperTradingSection = () => {
  return (
    <section className="py-32 px-6 lg:px-24 border-y border-[#1e2532] bg-[#050914] overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-[0.9] mb-6">
            LEARN <br/>
            WITHOUT <br/>
            <span className="text-gray-500">PAYING THE MARKET.</span>
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-md">
            Practice decisions before putting real capital at risk. Every trade is simulated, tracked, and behaviorally analyzed.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4" /> NO REAL CAPITAL AT RISK
          </div>
        </div>
        <div className="flex-1 w-full h-[400px] border border-[#1e2532] bg-[#0B1222] p-8 flex flex-col justify-between relative">
           <div className="absolute top-0 right-0 p-4 text-[10px] font-mono text-gray-600">SIMULATED PORTFOLIO</div>
           <div>
             <div className="text-[12px] font-mono text-gray-500 uppercase tracking-widest mb-2">Paper Capital</div>
             <div className="text-5xl font-mono font-bold text-white tracking-tight">₹1,00,000</div>
           </div>
           
           <div className="space-y-2">
             <div className="flex justify-between text-xs font-mono border-b border-[#1e2532] pb-2">
               <span className="text-emerald-400">BUY INFY</span>
               <span className="text-gray-400">FILLED</span>
             </div>
             <div className="flex justify-between text-xs font-mono border-b border-[#1e2532] pb-2">
               <span className="text-rose-400">SELL TCS</span>
               <span className="text-gray-400">FILLED</span>
             </div>
             <div className="flex justify-between text-xs font-mono pb-2">
               <span className="text-emerald-400">BUY RELIANCE</span>
               <span className="text-gray-500">QUEUED</span>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

// --- 6. AI + Human ---

const HumanAISection = () => {
  return (
    <section className="py-32 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto text-center mb-20">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-4">
          AI DOES THE PROCESSING.<br/>
          <span className="text-cyan-400">YOU MAKE THE DECISION.</span>
        </h2>
      </div>
      
      <div className="flex flex-col md:flex-row max-w-5xl mx-auto border border-[#1e2532]">
        <div className="flex-1 p-12 border-b md:border-b-0 md:border-r border-[#1e2532] bg-[#050914]">
          <div className="text-sm font-mono font-bold text-cyan-400 tracking-widest uppercase mb-8">FINAI</div>
          <ul className="space-y-4 text-xs font-mono text-gray-400 uppercase tracking-widest">
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-500" /> Millions of signals</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-500" /> Technical context</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-500" /> News RAG synthesis</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-500" /> Risk parameters</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-cyan-500" /> Behavioral patterns</li>
          </ul>
        </div>
        
        <div className="flex-1 p-12 bg-[#0B1222]">
          <div className="text-sm font-mono font-bold text-white tracking-widest uppercase mb-8">YOU</div>
          <ul className="space-y-4 text-xs font-mono text-white uppercase tracking-widest font-bold">
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-white" /> ENTER</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-white" /> EXIT</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-white" /> WAIT</li>
            <li className="flex items-center gap-2"><span className="w-1 h-1 bg-white" /> LEARN</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// --- 7. Final Climax & CTA ---

const FinalCTA = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative bg-black px-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="mb-24"
      >
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-gray-600 mb-8">
          STOP CHASING <br/> THE MARKET.
        </h2>
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-white">
          START <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000">
            UNDERSTANDING
          </span> IT.
        </h2>
      </motion.div>

      <div className="space-y-8 flex flex-col items-center">
        <h3 className="text-xl md:text-2xl font-bold text-white">READY TO THINK DIFFERENTLY?</h3>
        <p className="text-gray-400 text-sm max-w-md">Explore FinAI's AI-powered paper-trading ecosystem.</p>
        
        <Link to="/dashboard" className="group relative border border-cyan-500/50 bg-cyan-950/30 px-12 py-5 overflow-hidden transition-all hover:bg-cyan-900/50 hover:border-cyan-400">
          <div className="absolute inset-0 w-0 bg-cyan-500/10 transition-all duration-300 ease-out group-hover:w-full" />
          <div className="relative flex items-center gap-3 text-cyan-50 font-mono text-base tracking-widest uppercase font-bold">
            ENTER FINAI <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        
        <div className="flex gap-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
          <span>EDUCATIONAL PLATFORM</span>
          <span>&middot;</span>
          <span>PAPER TRADING</span>
          <span>&middot;</span>
          <span>ZERO REAL CAPITAL AT RISK</span>
        </div>
      </div>
    </section>
  );
};

// --- Main Page Component ---

export const LandingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#050914] text-white selection:bg-cyan-500/30 w-full overflow-hidden">
      <CinematicHero />
      <SignalTransformation />
      <IntelligenceEngine />
      <ProductEcosystem />
      <PaperTradingSection />
      <HumanAISection />
      <FinalCTA />
      
    </div>
  );
};
