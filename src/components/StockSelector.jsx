import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrading } from '../context/TradingContext';
import { ChevronDown } from 'lucide-react';

export const StockSelector = () => {
  const { selectedStock, setSelectedStock, stockList } = useTrading();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStocks = stockList.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center h-full relative z-[100]">
      <div 
        className="flex items-baseline gap-3 cursor-pointer group"
        onClick={() => setIsSearchActive(true)}
      >
        <div className="flex items-center gap-2 group-hover:text-cyan-400 transition-colors">
          <h1 className="text-3xl font-mono font-medium text-white tracking-tighter group-hover:text-cyan-400 transition-colors">
            {selectedStock}
          </h1>
          <ChevronDown className="w-5 h-5 text-gray-600 group-hover:text-cyan-500 transition-colors" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">NSE &middot; EQ</span>
          <span className="text-[12px] text-gray-500 font-sans">
            {stockList.find(s => s.symbol === selectedStock)?.name || 'Equity'}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isSearchActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-[350px] md:w-[400px] bg-[#000000] border border-gray-800 shadow-2xl z-[100] flex flex-col rounded-sm overflow-hidden"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050812] border-b border-gray-800 text-lg text-white px-4 py-3 outline-none font-mono placeholder:text-gray-700"
                autoFocus
                onBlur={() => setTimeout(() => setIsSearchActive(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchActive(false);
                }}
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    setSelectedStock(stock.symbol);
                    setIsSearchActive(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#0a1020] flex items-center justify-between transition-colors group border-b border-gray-900/50 last:border-0"
                >
                  <span className={`font-mono font-bold text-[13px] transition-colors ${stock.symbol === selectedStock ? 'text-cyan-400' : 'text-gray-300 group-hover:text-cyan-400'}`}>
                    {stock.symbol}
                  </span>
                  <span className="text-[11px] text-gray-600 truncate max-w-[200px]">{stock.name}</span>
                </button>
              ))}
              {filteredStocks.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-600 font-mono text-[11px]">
                  No stocks found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
