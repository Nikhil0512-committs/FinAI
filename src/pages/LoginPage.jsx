import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { setIsAuthModalOpen, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    // If the user lands here, we instantly open the Auth modal, 
    // or they can click the manual button if they close it.
    if (!user || user.user_id === 'usr_guest') {
      setIsAuthModalOpen(true);
    } else {
      navigate('/dashboard');
    }
  }, [setIsAuthModalOpen, user, navigate]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center pt-24 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm w-full px-4"
      >
        <h1 className="text-[10px] font-mono text-[var(--finai-cyan)] uppercase tracking-[0.2em] mb-4">Authentication</h1>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-6">
          Sign in to FinAI
        </h2>
        <p className="text-[var(--finai-text-secondary)] mb-8">
          The quantitative operating system awaits.
        </p>

        <button 
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full bg-[var(--finai-cyan)]/10 border border-[var(--finai-cyan)]/30 py-3 text-[var(--finai-cyan)] text-[12px] font-mono font-bold uppercase tracking-widest hover:bg-[var(--finai-cyan)]/20 transition-colors mb-6"
        >
          Open Authentication
        </button>

        <Link 
          to="/"
          className="text-[12px] font-mono text-[var(--finai-text-secondary)] hover:text-white uppercase tracking-widest transition-colors"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
};
