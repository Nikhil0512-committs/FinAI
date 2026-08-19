import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrading } from '../context/TradingContext';
import { 
  PlaySquare, 
  Play, 
  Pause, 
  RotateCcw, 
  Calendar, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Zap 
} from 'lucide-react';

export const MarketReplay = () => {
  const { setSelectedStock } = useTrading();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState('election_2024');
  const [isReplaying, setIsReplaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState('5x');

  const replayEvents = [
    {
      id: 'election_2024',
      title: 'Indian General Election Results Day (June 4, 2024)',
      date: '04 June 2024',
      volatility: 'Extreme (6.2% NIFTY Swing)',
      description: 'Paper-trade the historic market crash and sudden V-shaped recovery following election result declarations.',
      tickers: ['ADANIENT', 'RELIANCE', 'SBIN']
    },
    {
      id: 'budget_2025',
      title: 'Union Budget Announcement 2025',
      date: '01 Feb 2025',
      volatility: 'High Sectoral Swings',
      description: 'Test position sizing discipline across Infrastructure, Capital Goods, and Banking during tax policy announcements.',
      tickers: ['TATAMOTORS', 'HDFCBANK', 'LT']
    },
    {
      id: 'rbi_rate_2024',
      title: 'RBI Monetary Policy Committee Rate Decision',
      date: '06 Oct 2024',
      volatility: 'Banking Volatility Spike',
      description: 'Simulate high-frequency entries around repo rate updates.',
      tickers: ['ICICIBANK', 'AXISBANK', 'KOTAKBANK']
    }
  ];

  const handleStartReplay = (eventId, ticker) => {
    setSelectedStock(ticker);
    setIsReplaying(true);
    navigate('/terminal');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="fin-card p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/60 border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <PlaySquare className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-extrabold text-slate-100">Phase 2: Historical Market Replay Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Replay high-volatility Indian market days tick-by-tick. Accelerate psychological discipline training over historic events.
          </p>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold px-2">Speed:</span>
          {['1x', '5x', '10x', '20x'].map((s) => (
            <button
              key={s}
              onClick={() => setReplaySpeed(s)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                replaySpeed === s
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {replayEvents.map((ev) => (
          <div 
            key={ev.id}
            className={`fin-card p-5 space-y-4 transition-all border ${
              selectedEvent === ev.id
                ? 'border-purple-500/60 bg-slate-900/90 shadow-xl'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                {ev.date}
              </span>
              <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                <Flame className="h-3 w-3" />
                <span>{ev.volatility}</span>
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-100">{ev.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{ev.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {ev.tickers.map((t) => (
                  <span key={t} className="text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleStartReplay(ev.id, ev.tickers[0])}
                className="btn-primary py-1.5 px-3 text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Replay</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
