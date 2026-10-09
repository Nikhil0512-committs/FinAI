import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import { 
  Search, Bell, Sun, Moon, LayoutDashboard, TrendingUp, 
  BrainCircuit, BarChart3, History, Settings, ChevronDown, LogOut, Star
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
  const { trades, marketIndices, stockList, setSelectedStock, portfolio } = useTrading();
  const navigate = useNavigate();
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const filteredSearchStocks = searchQuery.trim() 
    ? (stockList || []).filter(s => 
        (s.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const recentTrades = trades?.slice(0, 5) || [];
  const unreadCount = recentTrades.length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className={`flex h-screen overflow-hidden selection:bg-[#00E6A8]/30 selection:text-[#00E6A8] print:h-auto print:overflow-visible ${isDarkMode ? 'bg-[#0B0E14] text-gray-300' : 'bg-gray-50 text-gray-800'}`}>
      {/* SIDEBAR */}
      <div className={`w-64 border-r flex flex-col justify-between py-6 shrink-0 z-20 print-hidden ${isDarkMode ? 'border-[#1C212D] bg-[#0B0E14]' : 'border-gray-200 bg-white'}`}>
        <div>
          <div className="px-6 mb-8 flex items-center gap-2">
            <h1 className={`text-2xl font-bold tracking-tight flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              FinAI 
              <span className="w-2 h-2 rounded-full bg-[#00E6A8] ml-1 shadow-[0_0_8px_rgba(0,230,168,0.6)]"></span>
            </h1>
          </div>
          <div className="flex flex-col gap-2 px-3">
            <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarLink to="/watchlist" icon={Star} label="Watchlist" />
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
      <div className="flex-1 flex flex-col overflow-hidden relative print:overflow-visible">
        
        {/* TOP BAR */}
        <header className={`h-20 border-b flex items-center justify-between gap-4 md:gap-6 px-6 shrink-0 z-20 print-hidden ${isDarkMode ? 'border-[#1C212D] bg-[#0B0E14]' : 'border-gray-200 bg-white'}`}>
           {/* Search Box with Real Stock Live Dropdown */}
           <div className="relative flex-1 max-w-[420px] min-w-[200px]">
             <div className={`flex items-center rounded-lg px-4 py-2.5 w-full border focus-within:border-[#00E6A8]/50 transition-colors ${isDarkMode ? 'bg-[#131722] border-[#1C212D]' : 'bg-gray-100 border-gray-200'}`}>
                 <Search className="text-gray-500 w-4 h-4 mr-3 shrink-0" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setIsSearchActive(true);
                   }}
                   onFocus={() => setIsSearchActive(true)}
                   placeholder="Search 250+ NSE stocks, e.g. RELIANCE, TCS, PNB..." 
                   className={`bg-transparent border-none outline-none text-sm w-full font-medium ${isDarkMode ? 'text-gray-200 placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-400'}`} 
                 />
                 {searchQuery && (
                   <button onClick={() => { setSearchQuery(''); setIsSearchActive(false); }} className="text-gray-500 hover:text-gray-300 text-xs ml-2">✕</button>
                 )}
             </div>

             {isSearchActive && searchQuery.trim() && (
               <div className={`absolute left-0 top-full mt-2 w-[420px] max-h-80 overflow-y-auto rounded-xl border shadow-2xl z-50 ${isDarkMode ? 'bg-[#131722] border-[#1C212D]' : 'bg-white border-gray-200'}`}>
                 {filteredSearchStocks.length > 0 ? (
                   filteredSearchStocks.map((stock) => {
                     const px = Number(stock.price || 0);
                     const chg = Number(stock.change_pct || 0);
                     const isPos = chg >= 0;
                     return (
                       <div
                         key={stock.symbol}
                         onClick={() => {
                           setSelectedStock(stock.symbol);
                           setSearchQuery('');
                           setIsSearchActive(false);
                           navigate('/terminal');
                         }}
                         className={`px-4 py-3 flex items-center justify-between cursor-pointer border-b transition-colors ${isDarkMode ? 'border-[#1C212D]/60 hover:bg-[#1C212D]' : 'border-gray-100 hover:bg-gray-50'}`}
                       >
                         <div className="flex flex-col">
                           <span className={`font-mono font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stock.symbol}</span>
                           <span className="text-[11px] text-gray-500 truncate max-w-[200px]">{stock.name || 'NSE Equity'}</span>
                         </div>
                         <div className="flex flex-col items-end">
                           <span className={`font-mono font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₹{px.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                           <span className={`text-[11px] font-mono font-bold ${isPos ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                             {isPos ? '+' : ''}{chg.toFixed(2)}%
                           </span>
                         </div>
                       </div>
                     );
                   })
                 ) : (
                   <div className="p-4 text-center text-xs text-gray-500">No stocks matching "{searchQuery}"</div>
                 )}
               </div>
             )}
           </div>
           
           {/* Right side icons */}
           <div className="flex items-center gap-4 lg:gap-8 shrink-0">
               <div className={`hidden md:flex items-center gap-4 lg:gap-8 border-r pr-4 lg:pr-8 ${isDarkMode ? 'border-[#1C212D]' : 'border-gray-200'}`}>
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
                  <div className={`flex flex-col px-3.5 py-1.5 rounded-xl border mr-2 shadow-sm ${isDarkMode ? 'bg-[#1C212D]/40 border-[#00E6A8]/20' : 'bg-gray-50 border-gray-200'}`}>
                     <span className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Balance</span>
                     <span className={`text-[13px] font-black tracking-tight text-right ${isDarkMode ? 'text-[#00E6A8]' : 'text-emerald-600'}`}>
                        ₹{portfolio?.cash_balance ? Number(portfolio.cash_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1,00,000.00'}
                     </span>
                  </div>
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
        <div className={`flex-1 overflow-y-auto custom-scrollbar relative print:overflow-visible ${!isDarkMode ? 'light-mode-invert' : ''}`}>
            {children}
        </div>
      </div>
    </div>
  );
};
