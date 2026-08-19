import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, BarChart3, History, ArrowRight } from 'lucide-react';

const PlatformCard = ({ title, desc, icon: Icon, to }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="border border-[var(--finai-border)] bg-[var(--finai-surface)] p-6 group hover:border-[var(--finai-cyan)]/50 transition-colors"
  >
    <div className="flex items-start justify-between mb-16">
      <Icon className="w-8 h-8 text-[var(--finai-text-muted)] group-hover:text-[var(--finai-cyan)] transition-colors" />
    </div>
    <div className="text-[10px] font-mono text-[var(--finai-cyan)] uppercase tracking-widest mb-2">{title}</div>
    <div className="text-xl font-medium text-white mb-6">{desc}</div>
    
    <Link 
      to={to}
      className="inline-flex items-center gap-2 text-[12px] font-mono text-[var(--finai-text-secondary)] group-hover:text-[var(--finai-cyan)] uppercase tracking-widest transition-colors"
    >
      Open {title} <ArrowRight className="w-4 h-4" />
    </Link>
  </motion.div>
);

export const PlatformPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center pt-24 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-2xl mb-24 px-4"
      >
        <h1 className="text-[10px] font-mono text-[var(--finai-cyan)] uppercase tracking-[0.2em] mb-4">FinAI Platform</h1>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          One quantitative environment for research, intelligence, and execution.
        </h2>
        <p className="text-[var(--finai-text-secondary)]">
          Explore the fully integrated suite of tools designed to build disciplined, data-driven traders.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full px-4">
        <PlatformCard title="Intelligence" desc="AI-powered market reasoning." icon={BrainCircuit} to="/intelligence" />
        <PlatformCard title="Terminal" desc="Professional paper trading." icon={TrendingUp} to="/terminal" />
        <PlatformCard title="Scorecard" desc="Behavioral trading diagnostics." icon={BarChart3} to="/scorecard" />
        <PlatformCard title="Orders" desc="Complete trade audit history." icon={History} to="/orders" />
      </div>
    </div>
  );
};
