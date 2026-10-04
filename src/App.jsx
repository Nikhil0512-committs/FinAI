import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TradingProvider } from './context/TradingContext';
import { FinAINavigation } from './components/FinAINavigation';
import { XaiReceiptModal } from './components/XaiReceiptModal';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { TerminalPage } from './pages/TerminalPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { ScorecardPage } from './pages/ScorecardPage';
import { OrdersPage } from './pages/OrdersPage';

import { LandingPage } from './pages/LandingPage';
import { PlatformPage } from './pages/PlatformPage';
import { ResearchPage } from './pages/ResearchPage';
import { LoginPage } from './pages/LoginPage';

import { ShieldCheck } from 'lucide-react';

// Conditionally render layout based on route
const RouteWrapper = ({ children }) => {
  const { pathname } = useLocation();
  const isPublic = ['/', '/platform', '/research', '/login'].includes(pathname);
  
  if (isPublic) {
    return (
      <div className="min-h-screen bg-[#050914] text-gray-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        <FinAINavigation mode="public" />
        <main className={pathname === '/' ? "w-full" : "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 flex-1"}>
          {children}
        </main>
        <FooterRenderer />
      </div>
    );
  }

  // App routes use the new AppLayout
  return <AppLayout>{children}</AppLayout>;
};

const FooterRenderer = () => {
  return (
    <footer className="bg-[#030712] border-t border-gray-800 py-4 mt-8 text-xs text-gray-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          <span>
            <strong className="text-gray-400">FinAI</strong> — Educational Paper-Trading Platform. Zero real capital at risk. SEBI Regulator-Safe.
          </span>
        </div>
        <div className="flex items-center space-x-3 text-gray-500 font-mono text-[11px]">
          <span>Team Hessonite</span>
          <span>·</span>
          <span>Spec v6.0</span>
          <span>·</span>
          <span>NSE / BSE</span>
        </div>
      </div>
    </footer>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TradingProvider>
          <RouteWrapper>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/terminal" element={<TerminalPage />} />
                <Route path="/intelligence" element={<IntelligencePage />} />
                <Route path="/scorecard" element={<ScorecardPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/platform" element={<PlatformPage />} />
                <Route path="/research" element={<ResearchPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
            <XaiReceiptModal />
            <AuthModal />
          </RouteWrapper>

        </TradingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
