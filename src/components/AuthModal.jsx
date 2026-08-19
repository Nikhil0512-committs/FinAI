import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuthModal = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(username, password);
      setLoading(false);
      if (res.success) {
        setSuccess('Logged in successfully!');
      } else {
        setError(res.error);
      }
    } else {
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      const res = await register(username, email, password);
      setLoading(false);
      if (res.success) {
        setSuccess('Account registered & logged in!');
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#090e1c] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Logo */}
        <div className="space-y-1 text-center pt-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="font-extrabold text-2xl text-slate-100">FinAI</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold">
              PORTFOLIO AUTH
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {mode === 'login' ? 'Sign in to track your paper trading portfolio & SEBI risk logs' : 'Create a free FinAI trader account to track your trades'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-mono font-bold">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${mode === 'login' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`py-2 rounded-xl transition-all ${mode === 'signup' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl font-medium flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">
              {mode === 'login' ? 'Username or Email Address' : 'Username / Trader Handle'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder={mode === 'login' ? 'e.g. nikhil_trader or nikhil@gmail.com' : 'e.g. nikhil_trader'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. nikhil@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-xs font-extrabold justify-center shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Portfolio' : 'Create Free Account'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 inline" />
            <span>Encrypted local session token • SEBI Behavioral Audit Compliant</span>
          </div>
        </div>

      </div>
    </div>
  );
};
