import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTrading } from '../context/TradingContext';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, TrendingDown, Clock, Activity, ArrowRight, X } from 'lucide-react';

export const WatchlistPage = () => {
  const { watchlist, stockList, toggleWatchlist, setSelectedStock } = useTrading();
  const navigate = useNavigate();

  const watchlistStocks = stockList.filter(s => watchlist.includes(s.symbol));

  const handleStockClick = (symbol) => {
    setSelectedStock(symbol);
    navigate('/terminal');
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            Your Watchlist
          </h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wide">
            Track and manage your favorite stocks in real-time.
          </p>
        </div>
        <div className="px-4 py-2 bg-[#1C212D] rounded-full border border-gray-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00E6A8]" />
          <span className="text-sm font-medium text-white">{watchlist.length} Assets Tracked</span>
        </div>
      </div>

      {watchlistStocks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl bg-[#0c101a]/50">
          <Star className="w-16 h-16 text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">Your Watchlist is Empty</h3>
          <p className="text-gray-500 max-w-md text-center text-sm leading-relaxed mb-6">
            Head over to the Terminal and click the star icon next to any stock to add it to your watchlist for quick access.
          </p>
          <button 
            onClick={() => navigate('/terminal')}
            className="px-6 py-3 bg-[#00E6A8] text-[#000000] rounded-xl font-bold hover:bg-[#00c993] transition-colors flex items-center gap-2"
          >
            Go to Terminal
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {watchlistStocks.map((stock, idx) => {
              const price = Number(stock.price || 0);
              const changePct = Number(stock.change_pct || 0);
              const isPos = changePct >= 0;
              const changeAmt = price * Math.abs(changePct) / 100;

              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="group relative bg-[#131722] border border-[#1C212D] hover:border-[#00E6A8]/50 rounded-2xl p-5 cursor-pointer shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  onClick={() => handleStockClick(stock.symbol)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00E6A8]/5 to-transparent rounded-bl-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#1C212D] flex items-center justify-center border border-gray-800">
                        <span className="text-xs font-black text-gray-300">{stock.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white tracking-tight">{stock.symbol}</h3>
                        <p className="text-[11px] text-gray-500 truncate max-w-[120px]">{stock.name || 'NSE Equity'}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(stock.symbol);
                      }}
                      className="p-2 bg-gray-900/50 hover:bg-rose-500/10 rounded-lg group/btn transition-colors"
                      title="Remove from Watchlist"
                    >
                      <X className="w-4 h-4 text-gray-500 group-hover/btn:text-rose-500 transition-colors" />
                    </button>
                  </div>

                  <div className="relative z-10 mt-6 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Live Price</div>
                      <div className="text-2xl font-mono font-bold text-white tracking-tight">
                        ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className={`flex flex-col items-end ${isPos ? 'text-[#00E6A8]' : 'text-rose-500'}`}>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {isPos ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isPos ? '+' : ''}{changePct.toFixed(2)}%</span>
                      </div>
                      <div className="text-[11px] font-mono opacity-80">
                        {isPos ? '+' : '-'}₹{changeAmt.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-gray-800/50 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {stock.time ? stock.time.split(' ')[1] : 'Live'}
                    </div>
                    <div>Vol: {(Number(stock.volume || 0) / 100000).toFixed(2)}L</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
