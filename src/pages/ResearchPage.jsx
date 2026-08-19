import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen } from 'lucide-react';

export const ResearchPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-2xl px-4"
      >
        <BookOpen className="w-12 h-12 text-[var(--finai-cyan)] mx-auto mb-8 opacity-50" />
        <h1 className="text-[10px] font-mono text-[var(--finai-cyan)] uppercase tracking-[0.2em] mb-4">FinAI Research</h1>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
          Institutional-grade market research.
        </h2>
        <p className="text-[var(--finai-text-secondary)] mb-12">
          The deep structured research environment is currently being prepared.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link 
            to="/platform"
            className="text-[12px] font-mono text-[var(--finai-text-secondary)] hover:text-white uppercase tracking-widest transition-colors"
          >
            Return to Platform
          </Link>
          <Link 
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-[var(--finai-cyan)]/10 border border-[var(--finai-cyan)]/30 px-5 py-2 text-[var(--finai-cyan)] text-[12px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--finai-cyan)]/20 transition-colors"
          >
            Enter FinAI <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
