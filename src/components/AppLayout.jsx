import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import { 
  Search, Bell, Sun, Moon, LayoutDashboard, TrendingUp, 
  BrainCircuit, BarChart3, History, Settings, ChevronDown, LogOut
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-[#003d2d] text-[#00E6A8] border border-[#00E6A8]' : 'text-gray-500 hover:text-gray-300'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { trades, marketIndices } = useTrading();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const recentTrades = trades?.slice(0, 5) || [];
  const unreadCount = recentTrades.length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className={`flex h-screen overflow-hidden selection:bg-[#00E6A8]/30 selection:text-[#00E6A8] ${isDarkMode ? 'bg-[#0B0E14] text-gray-300' : 'bg-gray-50 text-gray-800'}`}>
      {/* SIDEBAR */}
      <div className={`w-64 border-r flex flex-col justify-between py-6 shrink-0 z-20 ${isDarkMode ? 'border-[#1C212D] bg-[#0B0E14]' : 'border-gray-200 bg-white'}`}>
        <div>
          <div className="px-6 mb-8 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
              FinAI 
              <span className="w-2 h-2 rounded-full bg-[#00E6A8] ml-1 shadow-[0_0_8px_rgba(0,230,168,0.6)]"></span>
            </h1>
          </div>
          <div className="flex flex-col gap-2 px-3">
            <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarLink to="/terminal" icon={TrendingUp} label="Terminal" />
            <SidebarLink to="/intelligence" icon={BrainCircuit} label="Intelligence" />
            <SidebarLink to="/scorecard" icon={BarChart3} label="Scorecard" />
            <SidebarLink to="/orders" icon={History} label="Orders" />
          </div>
        </div>
        <div className="px-3">
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-gray-300 transition-all">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
            </Link>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className={`h-20 border-b flex items-center justify-between px-6 shrink-0 z-20 ${isDarkMode ? 'border-[#1C212D] bg-[#0B0E14]' : 'border-gray-200 bg-white'}`}>
           {/* Search Box */}
           <div className={`flex items-center rounded-lg px-4 py-2.5 w-[420px] border focus-within:border-[#00E6A8]/50 transition-colors ${isDarkMode ? 'bg-[#131722] border-[#1C212D]' : 'bg-gray-100 border-gray-200'}`}>
               <Search className="text-gray-500 w-4 h-4 mr-3" />
               <input type="text" placeholder="Search stocks, indices, or strategies..." className={`bg-transparent border-none outline-none text-sm w-full font-medium ${isDarkMode ? 'text-gray-300 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-400'}`} />
           </div>
           
           {/* Right side icons */}
           <div className="flex items-center gap-8">
               <div className={`flex items-center gap-8 border-r pr-8 ${isDarkMode ? 'border-[#1C212D]' : 'border-gray-200'}`}>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">NIFTY</span>
                     <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {marketIndices?.nifty?.price ? Number(marketIndices.nifty.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '22,535.00'}
                        </span>
                        <span className={`text-[11px] font-mono ${(marketIndices?.nifty?.change_pct ?? 0) >= 0 ? 'text-[#00E6A8]' : 'text-rose-400'}`}>
                          {(marketIndices?.nifty?.change_pct ?? 0) >= 0 ? '+' : ''}{Number(marketIndices?.nifty?.change_pct ?? 0.50).toFixed(2)}%
                        </span>
                     </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">BANKNIFTY</span>
                     <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {marketIndices?.banknifty?.price ? Number(marketIndices.banknifty.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '54,675.85'}
                        </span>
                        <span className={`text-[11px] font-mono ${(marketIndices?.banknifty?.change_pct ?? 0) >= 0 ? 'text-[#00E6A8]' : 'text-rose-400'}`}>
                          {(marketIndices?.banknifty?.change_pct ?? 0) >= 0 ? '+' : ''}{Number(marketIndices?.banknifty?.change_pct ?? 0.41).toFixed(2)}%
                        </span>
                     </div>
                  </div>
               </div>
               
              <div className="flex items-center gap-5 relative">
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:text-gray-400 transition-colors">
                    {isDarkMode ? <Sun className="w-5 h-5 text-gray-500" /> : <Moon className="w-5 h-5 text-gray-500" />}
                  </button>
                  
                  <div className="relative">
                    <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative hover:text-gray-400 transition-colors flex items-center justify-center">
                        <Bell className="w-5 h-5 text-gray-500" /> 
                        {unreadCount > 0 && <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border ${isDarkMode ? 'border-[#0B0E14]' : 'border-white'}`}></span>}
                    </button>
                    {isNotifOpen && (
                      <div className={`absolute right-0 mt-4 w-72 rounded-xl border shadow-xl z-50 ${isDarkMode ? 'bg-[#131722] border-[#1C212D]' : 'bg-white border-gray-200'}`}>
                        <div className={`px-4 py-3 border-b text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'border-[#1C212D] text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                          Recent Trades
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {recentTrades.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">No recent activity.</div>
                          ) : (
                            recentTrades.map((t, i) => (
                              <div key={i} className={`p-4 border-b last:border-0 ${isDarkMode ? 'border-[#1C212D]' : 'border-gray-100'}`}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.symbol}</span>
                                  <span className={`text-xs font-bold ${t.side==='BUY' ? 'text-[#00E6A8]' : 'text-rose-500'}`}>{t.side}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{t.quantity} shares</span>
                                  <span>₹{t.price}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <div onClick={() => setIsProfileOpen(!isProfileOpen)} className={`flex items-center gap-2 rounded-full px-1.5 py-1.5 pr-4 border cursor-pointer transition-colors ml-2 ${isDarkMode ? 'bg-[#131722] border-[#1C212D] hover:bg-[#1C212D]' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`}>
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">{user?.username?.[0]?.toUpperCase() || 'N'}</div>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user?.username || 'Nick'}</span>
                        <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
                    </div>
                    {isProfileOpen && (
                      <div className={`absolute right-0 mt-3 w-48 rounded-xl border shadow-xl z-50 overflow-hidden ${isDarkMode ? 'bg-[#131722] border-[#1C212D]' : 'bg-white border-gray-200'}`}>
                        <button onClick={handleLogout} className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'}`}>
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
              </div>
           </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {children}
        </div>
      </div>
    </div>
  );
};
