import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Bell, Sun, LayoutDashboard, TrendingUp, 
  BrainCircuit, BarChart3, History, Settings, ChevronDown
} from 'lucide-react';

const SidebarLink = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-[#00E6A8]/10 text-[#00E6A8] border border-[#00E6A8]/50' : 'text-gray-500 hover:text-gray-300'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
};

export const AppLayout = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-[#0B0E14] text-gray-300 font-sans overflow-hidden selection:bg-[#00E6A8]/30 selection:text-[#00E6A8]">
      {/* SIDEBAR */}
      <div className="w-64 border-r border-[#1C212D] bg-[#0B0E14] flex flex-col justify-between py-6 shrink-0 z-20">
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
        <header className="h-20 border-b border-[#1C212D] bg-[#0B0E14] flex items-center justify-between px-6 shrink-0 z-20">
           {/* Search Box */}
           <div className="flex items-center bg-[#131722] rounded-lg px-4 py-2.5 w-[420px] border border-[#1C212D] focus-within:border-[#00E6A8]/50 transition-colors">
               <Search className="text-gray-500 w-4 h-4 mr-3" />
               <input type="text" placeholder="Search stocks, indices, or strategies..." className="bg-transparent border-none outline-none text-sm w-full text-gray-300 placeholder:text-gray-600 font-medium" />
           </div>
           
           {/* Right side icons */}
           <div className="flex items-center gap-8">
               <div className="flex items-center gap-8 border-r border-[#1C212D] pr-8">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">NIFTY</span>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">24,847.20</span>
                        <span className="text-[11px] text-[#00E6A8]">+0.62%</span>
                     </div>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">BANKNIFTY</span>
                     <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-medium">52,316.05</span>
                        <span className="text-[11px] text-rose-400">-0.18%</span>
                     </div>
                  </div>
               </div>
               
              <div className="flex items-center gap-5">
                  <button className="hover:text-white transition-colors"><Sun className="w-5 h-5 text-gray-500" /></button>
                  <button className="relative hover:text-white transition-colors">
                      <Bell className="w-5 h-5 text-gray-500" /> 
                      <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-[#0B0E14]"></span>
                  </button>
                  <div className="flex items-center gap-2 bg-[#131722] rounded-full px-1.5 py-1.5 pr-4 border border-[#1C212D] cursor-pointer hover:bg-[#1C212D] transition-colors ml-2">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner">N</div>
                      <span className="text-sm text-white font-medium">{user?.username || 'Nick'}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
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
