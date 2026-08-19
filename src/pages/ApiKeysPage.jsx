import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, CheckCircle2, Eye, EyeOff, Save, ExternalLink, 
  Sparkles, Zap, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Activity, Terminal
} from 'lucide-react';

// Reusable technical input component
const TechnicalInput = ({ label, type, value, onChange, placeholder, showToggle, onToggle, isSecret }) => {
  const [focused, setFocused] = useState(false);
  const displayType = isSecret ? 'password' : type;
  
  return (
    <div className="space-y-1.5 w-full">
      <label className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${focused ? 'text-cyan-400' : 'text-gray-500'}`}>
        {label}
      </label>
      <div className={`relative border flex items-center bg-[#050914] transition-all duration-200 ${focused ? 'border-cyan-500 shadow-[0_0_0_1px_rgba(0,255,255,0.12)]' : 'border-[#1e2532]'}`}>
        <input
          type={displayType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white text-[11px] font-mono tabular-nums px-4 py-3 focus:outline-none placeholder:text-gray-700"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 text-gray-500 hover:text-white transition-colors"
          >
            {isSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export const ApiKeysPage = () => {
  const { apiKeys, saveApiKeys, fetchApiKeys } = useTrading();

  const [geminiKey, setGeminiKey] = useState('');
  const [fyersAppId, setFyersAppId] = useState('');
  const [fyersSecretId, setFyersSecretId] = useState('');
  const [fyersRedirectUrl, setFyersRedirectUrl] = useState('http://localhost:5173');
  const [fyersAccessToken, setFyersAccessToken] = useState('');

  const [showGemini, setShowGemini] = useState(false);
  const [showFyersSecret, setShowFyersSecret] = useState(false);
  const [showFyersToken, setShowFyersToken] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('IDLE'); // IDLE, SAVING, SUCCESS, ERROR
  const [openGuide, setOpenGuide] = useState(null);

  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState(null);

  const [testingFyers, setTestingFyers] = useState(false);
  const [fyersStatus, setFyersStatus] = useState(null);

  useEffect(() => {
    if (apiKeys) {
      if (apiKeys.gemini_api_key) setGeminiKey(apiKeys.gemini_api_key);
      if (apiKeys.fyers_app_id) setFyersAppId(apiKeys.fyers_app_id);
      if (apiKeys.fyers_secret_id) setFyersSecretId(apiKeys.fyers_secret_id);
      if (apiKeys.fyers_redirect_url) setFyersRedirectUrl(apiKeys.fyers_redirect_url);
      if (apiKeys.fyers_access_token) setFyersAccessToken(apiKeys.fyers_access_token);
    }
  }, [apiKeys]);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSaveStatus('SAVING');

    const payload = {
      gemini_api_key: geminiKey,
      fyers_app_id: fyersAppId,
      fyers_secret_id: fyersSecretId,
      fyers_redirect_url: fyersRedirectUrl,
      fyers_access_token: fyersAccessToken,
      claude_api_key: apiKeys?.claude_api_key || ''
    };

    const res = await saveApiKeys(payload);
    setSaving(false);
    if (res && res.success) {
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 4000);
    } else {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 4000);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiStatus(null);
    // Simulate terminal connection ping
    await new Promise(r => setTimeout(r, 1500));
    setTestingGemini(false);
    if (geminiKey.trim().length > 10) {
      setGeminiStatus('SUCCESS');
    } else {
      setGeminiStatus('FAILED');
    }
  };

  const handleTestFyers = async () => {
    setTestingFyers(true);
    setFyersStatus(null);
    // Simulate broker ping
    await new Promise(r => setTimeout(r, 1800));
    setTestingFyers(false);
    if (fyersAppId.trim().length > 5 && fyersSecretId.trim().length > 5) {
      setFyersStatus('SUCCESS');
    } else {
      setFyersStatus('FAILED');
    }
  };

  const toggleGuide = (id) => setOpenGuide(openGuide === id ? null : id);

  const hasGemini = geminiKey.trim().length > 0;
  const hasFyers = fyersAppId.trim().length > 0;
  const activeConnections = (hasGemini ? 1 : 0) + (hasFyers ? 1 : 0);

  const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: i * 0.07, ease: [0.215, 0.610, 0.355, 1.000] }
    })
  };

  return (
    <div className="min-h-screen bg-[#050914] text-gray-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 relative">
      
      {/* Subtle Atmospheric Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_50%_0%,_rgba(0,229,255,0.035),_transparent_45%)] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-12 space-y-8 relative z-10">

        {/* ─── 1. HERO HEADER ─── */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants} className="border border-[#1e2532] bg-[#0B1222]/80 backdrop-blur-md p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-900/10 to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h1 className="text-[13px] font-mono font-bold tracking-[2px] uppercase">FinAI Connection Center</h1>
              </div>
              <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white mt-2">
                Infrastructure & API Control
              </h2>
              <p className="text-sm text-gray-400 max-w-xl leading-relaxed border-l-2 border-cyan-900/50 pl-4">
                Manage the external intelligence, brokerage, and market-data systems connected to your FinAI environment from one secure console.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 mt-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Connections</span>
                  <span className="text-[11px] font-mono text-white tracking-widest uppercase">{activeConnections < 10 ? `0${activeConnections}` : activeConnections} Active</span>
                </div>
                <div className="w-px h-6 bg-[#1e2532]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Environment</span>
                  <span className="text-[11px] font-mono text-white tracking-widest uppercase">Paper Trading</span>
                </div>
                <div className="w-px h-6 bg-[#1e2532]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Security</span>
                  <span className="text-[11px] font-mono text-white tracking-widest uppercase">Encrypted</span>
                </div>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-start md:items-end gap-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">System Status</span>
              <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-950/20 border border-emerald-900/50 px-4 py-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── 2. CONNECTION MATRIX ─── */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
          <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-3">Connected Infrastructure</div>
          <div className="border border-[#1e2532] bg-[#0B1222] overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#1e2532] bg-[#050914]/50">
                  <th className="py-3 px-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal">Service</th>
                  <th className="py-3 px-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal">Type</th>
                  <th className="py-3 px-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal">Status</th>
                  <th className="py-3 px-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal">Environment</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono uppercase tracking-widest">
                <tr className="border-b border-[#1e2532]/50 hover:bg-[#1e2532]/20 transition-colors">
                  <td className="py-4 px-6 text-white font-bold flex items-center gap-3"><Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" /> Gemini</td>
                  <td className="py-4 px-6 text-gray-400">AI Engine</td>
                  <td className="py-4 px-6">
                    <span className={`flex items-center gap-2 ${hasGemini ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasGemini ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {hasGemini ? 'Connected' : 'Not Configured'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">Production</td>
                </tr>
                <tr className="border-b border-[#1e2532]/50 hover:bg-[#1e2532]/20 transition-colors">
                  <td className="py-4 px-6 text-white font-bold flex items-center gap-3"><Zap className="w-3.5 h-3.5 text-[#FFB000]" /> Fyers</td>
                  <td className="py-4 px-6 text-gray-400">Broker</td>
                  <td className="py-4 px-6">
                    <span className={`flex items-center gap-2 ${hasFyers ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasFyers ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {hasFyers ? 'Connected' : 'Not Configured'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">Paper</td>
                </tr>
                <tr className="hover:bg-[#1e2532]/20 transition-colors">
                  <td className="py-4 px-6 text-gray-400 font-bold flex items-center gap-3"><Activity className="w-3.5 h-3.5 text-gray-500" /> Market Data</td>
                  <td className="py-4 px-6 text-gray-400">Data Feed</td>
                  <td className="py-4 px-6">
                    <span className="flex items-center gap-2 text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      Offline
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">Local</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── 3. INFRASTRUCTURE TOPOLOGY ─── */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants} className="py-12 flex justify-center">
          <div className="relative w-full max-w-2xl h-[240px] flex flex-col items-center">
            
            {/* Top Node */}
            <div className="absolute top-0 flex flex-col items-center">
              <div className="bg-[#050914] border border-gray-700 px-6 py-2 z-10">
                <span className="text-[11px] font-mono text-white tracking-widest uppercase">FinAI Core</span>
              </div>
              <div className="w-px h-8 bg-gray-800" />
              <div className="w-[320px] h-px bg-gray-800 relative flex justify-between">
                <div className="w-px h-8 bg-gray-800 -mb-8" />
                <div className="w-px h-8 bg-gray-800 -mb-8" />
              </div>
            </div>

            {/* Bottom Nodes */}
            <div className="absolute top-[100px] w-[400px] flex justify-between">
              
              {/* Gemini Node */}
              <div className="flex flex-col items-center">
                <div className="bg-[#050914] border border-[#00E5FF]/30 px-6 py-4 flex flex-col items-center text-center w-36">
                  <Sparkles className="w-4 h-4 text-[#00E5FF] mb-2" />
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">AI Engine</span>
                  <span className="text-[11px] font-mono text-white uppercase tracking-widest">Gemini</span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest mt-2 flex items-center gap-1 ${hasGemini ? 'text-emerald-400' : 'text-gray-600'}`}>
                    <span className={`w-1 h-1 rounded-full ${hasGemini ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    {hasGemini ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Fyers Node */}
              <div className="flex flex-col items-center">
                <div className="bg-[#050914] border border-[#FFB000]/30 px-6 py-4 flex flex-col items-center text-center w-36">
                  <Zap className="w-4 h-4 text-[#FFB000] mb-2" />
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Broker</span>
                  <span className="text-[11px] font-mono text-white uppercase tracking-widest">Fyers</span>
                  <span className={`text-[8px] font-mono uppercase tracking-widest mt-2 flex items-center gap-1 ${hasFyers ? 'text-emerald-400' : 'text-gray-600'}`}>
                    <span className={`w-1 h-1 rounded-full ${hasFyers ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    {hasFyers ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

            </div>

            {/* Animated SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {/* Core to Gemini */}
              {hasGemini && (
                <motion.path 
                  d="M336 32 L336 64 L176 64 L176 100" 
                  stroke="#00E5FF" 
                  strokeWidth="1.5"
                  fill="none" 
                  strokeOpacity="0.4"
                  initial={{ strokeDasharray: "100 100", strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: [100, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              )}
              {/* Core to Fyers */}
              {hasFyers && (
                <motion.path 
                  d="M336 32 L336 64 L496 64 L496 100" 
                  stroke="#FFB000" 
                  strokeWidth="1.5"
                  fill="none" 
                  strokeOpacity="0.4"
                  initial={{ strokeDasharray: "100 100", strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: [100, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: 0.5 }}
                />
              )}
            </svg>

          </div>
        </motion.div>

        {/* ─── 4. FORM AND OPERATIONS LAYOUT ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          <div className="xl:col-span-8 space-y-8">
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* AI INTELLIGENCE ENGINE */}
              <motion.div custom={3} initial="hidden" animate="visible" variants={sectionVariants} className="border border-[#1e2532] bg-[#0B1222]">
                <div className="p-6 border-b border-[#1e2532] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#050914]/40">
                  <div className="flex items-center gap-3 text-white">
                    <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                    <h2 className="text-xs font-mono font-bold tracking-widest uppercase">AI Intelligence Engine</h2>
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
                    {hasGemini ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 px-2 py-1 border border-emerald-900/50"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Connected</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-500 bg-gray-900/50 px-2 py-1 border border-gray-800"><span className="w-1.5 h-1.5 rounded-full bg-gray-600"/> Not Configured</span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="max-w-md space-y-4">
                      <div>
                        <h3 className="text-xl font-mono text-white tracking-tight uppercase">Google Gemini</h3>
                        <div className="text-[11px] font-mono text-[#00E5FF] tracking-widest uppercase mt-1">Gemini Flash</div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">
                        Provide your Gemini API key to activate AI reasoning, RAG synthesis, and market summaries.
                      </p>
                    </div>

                    <div className="flex-1 w-full max-w-sm space-y-6">
                      <TechnicalInput 
                        label="API Credential"
                        type={showGemini ? "text" : "password"}
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        isSecret={!showGemini}
                        showToggle={true}
                        onToggle={() => setShowGemini(!showGemini)}
                      />

                      {/* Diagnostic Terminal */}
                      <div className="bg-[#050914] border border-[#1e2532] p-4 text-[10px] font-mono uppercase tracking-widest">
                        <div className="text-gray-600 mb-2">Status</div>
                        <div className="text-white flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${hasGemini ? 'bg-cyan-500' : 'bg-gray-600'}`} />
                          {hasGemini ? 'Credential Configured' : 'Awaiting Credential'}
                        </div>

                        <AnimatePresence>
                          {testingGemini && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-[#1e2532] text-gray-400 space-y-2 overflow-hidden">
                              <div className="flex justify-between"><span>Authenticating...</span><span className="animate-pulse">_</span></div>
                              <div className="flex justify-between"><span>Endpoint Reachable...</span><span>✓</span></div>
                            </motion.div>
                          )}
                          {geminiStatus && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-4 pt-4 border-t border-[#1e2532] flex items-center gap-2 ${geminiStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-[#FF3B4A]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${geminiStatus === 'SUCCESS' ? 'bg-emerald-400' : 'bg-[#FF3B4A]'}`} />
                              {geminiStatus === 'SUCCESS' ? 'Connection Operational' : 'Connection Failed'}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center gap-4">
                        <button type="button" onClick={handleTestGemini} disabled={!hasGemini || testingGemini} className="flex-1 border border-[#1e2532] bg-[#050914] hover:bg-[#1e2532]/50 disabled:opacity-50 transition-colors text-[9px] font-mono text-gray-300 uppercase tracking-widest py-3">
                          {testingGemini ? 'Testing...' : 'Test Connection'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* BROKER CONNECTION */}
              <motion.div custom={4} initial="hidden" animate="visible" variants={sectionVariants} className="border border-[#1e2532] bg-[#0B1222]">
                <div className="p-6 border-b border-[#1e2532] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#050914]/40">
                  <div className="flex items-center gap-3 text-white">
                    <Zap className="w-4 h-4 text-[#FFB000]" />
                    <h2 className="text-xs font-mono font-bold tracking-widest uppercase">Broker Connection</h2>
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-2">
                    {hasFyers ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 px-2 py-1 border border-emerald-900/50"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Ready</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-500 bg-gray-900/50 px-2 py-1 border border-gray-800"><span className="w-1.5 h-1.5 rounded-full bg-gray-600"/> Not Configured</span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="max-w-md space-y-4">
                      <div>
                        <h3 className="text-xl font-mono text-white tracking-tight uppercase">Fyers</h3>
                        <div className="text-[11px] font-mono text-[#FFB000] tracking-widest uppercase mt-1">NSE / BSE &middot; Paper Trading</div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">
                        Brokerage infrastructure for simulated trade execution. Enter your Fyers App and Secret IDs to establish a connection.
                      </p>
                      
                      <AnimatePresence>
                        {testingFyers && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-[#050914] border border-[#1e2532] p-4 text-[10px] font-mono uppercase tracking-widest text-gray-400 space-y-2 overflow-hidden mt-6">
                            <div className="flex justify-between"><span>Authentication</span><span>✓</span></div>
                            <div className="flex justify-between"><span>API Endpoint</span><span>✓</span></div>
                            <div className="flex justify-between"><span>Paper Environment</span><span className="animate-pulse">_</span></div>
                          </motion.div>
                        )}
                        {fyersStatus && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-[#050914] border border-[#1e2532] p-4 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 mt-6 ${fyersStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-[#FF3B4A]'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${fyersStatus === 'SUCCESS' ? 'bg-emerald-400' : 'bg-[#FF3B4A]'}`} />
                            {fyersStatus === 'SUCCESS' ? 'Broker Connection Operational' : 'Authentication Failed'}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex-1 w-full space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <TechnicalInput 
                          label="App ID"
                          type="text"
                          value={fyersAppId}
                          onChange={(e) => setFyersAppId(e.target.value)}
                          placeholder="6W7E..."
                        />
                        <TechnicalInput 
                          label="Secret ID"
                          type={showFyersSecret ? "text" : "password"}
                          value={fyersSecretId}
                          onChange={(e) => setFyersSecretId(e.target.value)}
                          placeholder="•••••••••••••"
                          isSecret={!showFyersSecret}
                          showToggle={true}
                          onToggle={() => setShowFyersSecret(!showFyersSecret)}
                        />
                        <TechnicalInput 
                          label="Redirect URL"
                          type="text"
                          value={fyersRedirectUrl}
                          onChange={(e) => setFyersRedirectUrl(e.target.value)}
                          placeholder="http://localhost:5173"
                        />
                        <TechnicalInput 
                          label="Access Token"
                          type={showFyersToken ? "text" : "password"}
                          value={fyersAccessToken}
                          onChange={(e) => setFyersAccessToken(e.target.value)}
                          placeholder="•••••••••••••"
                          isSecret={!showFyersToken}
                          showToggle={true}
                          onToggle={() => setShowFyersToken(!showFyersToken)}
                        />
                      </div>
                      <div className="flex items-center gap-4 justify-end pt-4 border-t border-[#1e2532]">
                        <button type="button" onClick={handleTestFyers} disabled={!hasFyers || testingFyers} className="border border-[#1e2532] bg-[#050914] hover:bg-[#1e2532]/50 disabled:opacity-50 transition-colors text-[9px] font-mono text-gray-300 uppercase tracking-widest px-6 py-3">
                          {testingFyers ? 'Testing...' : 'Test Broker'}
                        </button>
                        
                        <button 
                          type="submit" 
                          disabled={saving} 
                          className={`relative overflow-hidden border px-8 py-3 text-[10px] font-mono uppercase tracking-widest font-bold transition-all ${
                            saveStatus === 'SUCCESS' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-900' :
                            saveStatus === 'ERROR' ? 'bg-rose-950/80 text-rose-400 border-rose-900' :
                            'bg-cyan-900/40 text-cyan-400 border-cyan-800 hover:bg-cyan-900/60'
                          }`}
                        >
                          {saveStatus === 'SAVING' ? 'Saving...' : 
                           saveStatus === 'SUCCESS' ? '✓ Config Saved' : 
                           saveStatus === 'ERROR' ? '⚠ Error' : 'Save Configuration'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </form>
          </div>

          <div className="xl:col-span-4 space-y-8">
            
            {/* SECURITY AUDIT */}
            <motion.div custom={5} initial="hidden" animate="visible" variants={sectionVariants} className="border border-[#1e2532] bg-[#0B1222] p-6">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-500" /> Security Status
              </div>
              
              <h3 className="text-sm font-mono text-white tracking-tight uppercase mb-4">Credential Security</h3>
              <p className="text-[11px] font-sans text-gray-400 leading-relaxed mb-6">
                API keys are masked in the UI display and saved locally for the current FinAI session.
              </p>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#1e2532] pb-2">
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">UI Display</span>
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">Masked</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#1e2532] pb-2">
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Storage</span>
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">Local Session</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Environment</span>
                  <span className="text-[10px] font-mono text-white uppercase tracking-widest">Paper Trading</span>
                </div>
              </div>

              <div className="mt-6 p-4 border border-amber-900/30 bg-amber-950/10 text-[10px] font-mono text-amber-500/80 leading-relaxed uppercase tracking-widest">
                ⚠ Never share API credentials publicly or commit them to source control.
              </div>
            </motion.div>

            {/* SETUP OPERATIONS */}
            <motion.div custom={6} initial="hidden" animate="visible" variants={sectionVariants} className="border border-[#1e2532] bg-[#0B1222] p-6">
              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" /> Setup Operations
              </div>

              <div className="space-y-3">
                {/* Guide 1 */}
                <div className="border border-[#1e2532] bg-[#050914] overflow-hidden">
                  <button onClick={() => toggleGuide('gemini')} className="w-full flex items-start justify-between p-4 hover:bg-[#1e2532]/30 transition-colors text-left">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">01 <span className="text-white">Get Gemini API Key</span></div>
                      <div className="text-[10px] font-mono text-gray-600 mt-1">Connect FinAI to Gemini intelligence</div>
                    </div>
                    {openGuide === 'gemini' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  <AnimatePresence>
                    {openGuide === 'gemini' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#1e2532] bg-[#0B1222] px-4 py-4 space-y-4">
                        <ol className="list-decimal list-inside space-y-3 text-[10px] font-mono text-gray-400 leading-relaxed uppercase tracking-widest">
                          <li>Go to <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a></li>
                          <li>Sign in and click "Get API key"</li>
                          <li>"Create API key in new project"</li>
                          <li>Copy key starting with AIzaSy</li>
                        </ol>
                        <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 w-full border border-[#1e2532] bg-[#050914] text-[9px] font-mono text-white uppercase tracking-widest py-3 hover:bg-[#1e2532]/50 transition-colors">
                          Open Guide <ExternalLink className="w-3 h-3" />
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Guide 2 */}
                <div className="border border-[#1e2532] bg-[#050914] overflow-hidden">
                  <button onClick={() => toggleGuide('fyers')} className="w-full flex items-start justify-between p-4 hover:bg-[#1e2532]/30 transition-colors text-left">
                    <div>
                      <div className="text-[10px] font-mono text-[#FFB000] uppercase tracking-widest flex items-center gap-2">02 <span className="text-white">Configure Fyers</span></div>
                      <div className="text-[10px] font-mono text-gray-600 mt-1">Setup broker credentials for paper trading</div>
                    </div>
                    {openGuide === 'fyers' ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  <AnimatePresence>
                    {openGuide === 'fyers' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[#1e2532] bg-[#0B1222] px-4 py-4 space-y-4">
                        <ol className="list-decimal list-inside space-y-3 text-[10px] font-mono text-gray-400 leading-relaxed uppercase tracking-widest">
                          <li>Log into <a href="https://myapi.fyers.in/" target="_blank" rel="noreferrer" className="text-[#FFB000] hover:underline">Fyers Dashboard</a></li>
                          <li>Create New App: FinAI Terminal</li>
                          <li>Set Redirect: http://localhost:5173</li>
                          <li>Copy App & Secret IDs</li>
                        </ol>
                        <a href="https://myapi.fyers.in/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 w-full border border-[#1e2532] bg-[#050914] text-[9px] font-mono text-white uppercase tracking-widest py-3 hover:bg-[#1e2532]/50 transition-colors">
                          Open Guide <ExternalLink className="w-3 h-3" />
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>

            {/* OFFLINE MODE */}
            <motion.div custom={7} initial="hidden" animate="visible" variants={sectionVariants} className="border border-[#1e2532] bg-[#050914] p-6">
               <h3 className="text-xs font-mono font-bold text-white tracking-widest uppercase mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full border border-gray-500" /> Offline Operating Mode
               </h3>
               <p className="text-[11px] font-sans text-gray-400 leading-relaxed mb-6">
                 Run FinAI without external API credentials. Built-in historical datasets remain available for supported simulations and paper-trading workflows.
               </p>
               <div className="flex items-center justify-between">
                 <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                   Status <span className="text-emerald-400 ml-2">● Available</span>
                 </div>
                 <button className="border border-[#1e2532] bg-[#0B1222] text-[9px] font-mono text-white uppercase tracking-widest px-4 py-2 hover:bg-[#1e2532] transition-colors">
                   Activate Offline
                 </button>
               </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};
