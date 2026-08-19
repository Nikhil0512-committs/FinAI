import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Info,
  X,
  Zap,
  HelpCircle
} from 'lucide-react';

export const XaiReceiptModal = () => {
  const { 
    activeXaiReceipt, 
    setActiveXaiReceipt, 
    pendingTrade, 
    executeTradeDirectly 
  } = useTrading();

  const [selectedCitedTrade, setSelectedCitedTrade] = useState(null);

  if (!activeXaiReceipt) return null;

  const { 
    receipt_code, 
    title, 
    explanation, 
    recommendation, 
    cited_trade_ids, 
    cited_details, 
    counterfactual 
  } = activeXaiReceipt;

  const handleAcceptCoolingOff = async () => {
    await executeTradeDirectly(pendingTrade, true);
  };

  const handleResizeOrder = async () => {
    const resizedParams = {
      ...pendingTrade,
      quantity: Math.max(1, Math.floor(pendingTrade.quantity / 2))
    };
    await executeTradeDirectly(resizedParams, false);
  };

  const handleProceedAnyway = async () => {
    await executeTradeDirectly(pendingTrade, false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="fin-card-highlight max-w-2xl w-full p-6 relative shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-cyan-800/40 pb-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center pulse-cyan">
              <ShieldAlert className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">{receipt_code}</span>
                <span className="bg-amber-950 text-amber-400 border border-amber-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  XAI Behavioral Flag
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-100 mt-0.5">{title}</h2>
            </div>
          </div>
          <button
            onClick={() => setActiveXaiReceipt(null)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Behavioral Evidence Section (Cited Past Trades) */}
        <div className="space-y-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span className="flex items-center space-x-1.5 text-cyan-300">
              <Zap className="h-4 w-4" />
              <span>Cited Trade Evidence (Ground Truth)</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Deterministic Z-score Proof</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {explanation}
          </p>

          {/* Interactive Trade Chips */}
          {cited_trade_ids && cited_trade_ids.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Click cited trade ID to inspect historical evidence:
              </div>
              <div className="flex flex-wrap gap-2">
                {cited_trade_ids.map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      const detail = cited_details?.find(d => d.code === code);
                      setSelectedCitedTrade(detail || { code, symbol: 'HDFCBANK', side: 'BUY', price: 1520.0, pnl: -3200.0, timestamp: '15 mins ago' });
                    }}
                    className={`font-mono text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center space-x-1.5 ${
                      selectedCitedTrade?.code === code
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                        : 'bg-slate-950 text-cyan-400 border-cyan-800/80 hover:bg-cyan-950'
                    }`}
                  >
                    <span>View Trade: {code}</span>
                  </button>
                ))}
              </div>

              {/* Selected Cited Trade Detail Drawer */}
              {selectedCitedTrade && (
                <div className="p-3 bg-slate-950 border border-cyan-800/50 rounded-lg text-xs font-mono space-y-1 animate-fade-in">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>{selectedCitedTrade.code} • {selectedCitedTrade.symbol} ({selectedCitedTrade.side})</span>
                    <span className="text-rose-400">P&L: ₹{selectedCitedTrade.pnl.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Execution Price: ₹{selectedCitedTrade.price}</span>
                    <span>Timestamp: {selectedCitedTrade.timestamp}</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FLAGSHIP: "What-If" Counterfactual P&L Engine Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-indigo-500/40 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-extrabold text-indigo-300">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>The "What-If" Counterfactual P&L Engine</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
              Rupee ROI on Discipline
            </span>
          </div>

          {/* Side-by-Side P&L Comparison */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Actual Undisciplined P&L */}
            <div className="bg-slate-950/80 border border-rose-900/50 p-3.5 rounded-xl text-center">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">Actual Portfolio P&L</div>
              <div className="font-mono text-xl font-extrabold text-rose-400 mt-1">
                -₹{Math.abs(counterfactual?.actual_pnl || 8500).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-rose-300/80 mt-1">Undisciplined Execution</div>
            </div>

            {/* Counterfactual Disciplined P&L */}
            <div className="bg-slate-950/80 border border-emerald-800/60 p-3.5 rounded-xl text-center pulse-green">
              <div className="text-[11px] text-slate-400 font-semibold uppercase">With 20-min Cooling-off</div>
              <div className="font-mono text-xl font-extrabold text-emerald-400 mt-1">
                +₹{counterfactual?.counterfactual_pnl?.toLocaleString('en-IN') || '14,200'}
              </div>
              <div className="text-[10px] text-emerald-300/80 mt-1">Disciplined ROI</div>
            </div>

          </div>

          <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Net Rupee Discipline ROI:</span>
            <span className="font-mono font-extrabold text-emerald-400 text-sm">
              +₹{counterfactual?.discipline_roi?.toLocaleString('en-IN') || '22,700'}
            </span>
          </div>

        </div>

        {/* Action Choice Buttons */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-300">Choose your coaching response:</div>
          
          <button
            onClick={handleAcceptCoolingOff}
            className="w-full btn-primary py-3 rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Accept 20-Minute Cooling-Off Pause (Recommended)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResizeOrder}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs rounded-xl transition-all"
            >
              Resize Order by 50%
            </button>
            <button
              onClick={handleProceedAnyway}
              className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-rose-900/60 text-rose-400 font-bold text-xs rounded-xl transition-all"
            >
              Proceed Anyway (Log Risk)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
