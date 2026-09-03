import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || "";

const TradingContext = createContext();

export const TradingProvider = ({ children }) => {
  const { user, userId } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoInitializationState, setDemoInitializationState] = useState('IDLE');
  const [selectedStock, setSelectedStock] = useState('ADANIENT');
  const [timeframe, setTimeframe] = useState('5m');
  const [portfolio, setPortfolio] = useState({
    cash_balance: 100000.0,
    initial_balance: 100000.0,
    invested: 0.0,
    total_value: 100000.0,
    total_pnl: 0.0,
    open_trades_count: 0
  });
  const [tradeCount, setTradeCount] = useState(0);
  const [profileUnlocked, setProfileUnlocked] = useState(false);
  const [disciplineScore, setDisciplineScore] = useState(82);
  const [trades, setTrades] = useState([]);
  const [activeTab, setActiveTab] = useState('terminal'); // terminal | intelligence | scorecard | replay | orders
  const [stockList, setStockList] = useState([]);
  const [candles, setCandles] = useState([]);
  const [currentQuote, setCurrentQuote] = useState({ price: null, change_pct: null, time: null });
  const [marketDataSource, setMarketDataSource] = useState('api_unavailable');
  const [marketDataError, setMarketDataError] = useState(null);
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [isTiltMode, setIsTiltMode] = useState(false);
  const [tiltModeTimeLeft, setTiltModeTimeLeft] = useState(0);

  // XAI Receipt Modal State
  const [activeXaiReceipt, setActiveXaiReceipt] = useState(null);
  const [pendingTrade, setPendingTrade] = useState(null);
  const [coolingOffTimer, setCoolingOffTimer] = useState(null); // seconds left

  // Fetch initial stocks and portfolio
  const fetchPortfolio = async (uid = userId) => {
    try {
      const activeUser = uid || 'usr_guest';
      const res = await fetch(`${API_BASE}/api/portfolio?user_id=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
        setTradeCount(data.trade_count);
        setProfileUnlocked(data.profile_unlocked);
        setDisciplineScore(data.discipline_score);
      }
    } catch (e) {
      console.warn("Using fallback local portfolio state");
    }
  };

  const fetchTrades = async (uid = userId) => {
    try {
      const activeUser = uid || 'usr_guest';
      const res = await fetch(`${API_BASE}/api/trades?user_id=${encodeURIComponent(activeUser)}`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades);
      }
    } catch (e) {
      console.warn("Using fallback trade history");
    }
  };

  const fetchStockList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stocks`);
      if (res.ok) {
        const data = await res.json();
        setStockList(data.stocks);

        const liveRes = await fetch(`${API_BASE}/api/live-stocks?limit=250`);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          const liveBySymbol = new Map(liveData.stocks.map((stock) => [stock.symbol, stock]));
          setStockList((prev) => prev.map((stock) => liveBySymbol.get(stock.symbol) || stock));
        }
      }
    } catch (e) {
      setStockList([
        { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', exchange: 'NSE', sector: 'Metals & Energy' },
        { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Energy & Telecom' },
        { symbol: 'TCS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services' },
        { symbol: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', sector: 'IT Services' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', sector: 'Banking & Financials' }
      ]);
    }
  };

  const fetchCandles = async (symbol, tf = timeframe) => {
    setLoadingCandles(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${API_BASE}/api/candles/${encodeURIComponent(symbol)}?timeframe=${tf}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setCandles(data.candles || []);
        if (data.candles && data.candles.length > 0) {
          // Only update market data source info, let fetchLiveQuote handle the actual price
          setMarketDataSource(data.source || 'broker_api');
          setMarketDataError(data.error || null);
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn(`Candle fetch error for ${symbol}:`, e);
      }
      setMarketDataSource('api_unavailable');
      setMarketDataError('Live candle request timeout or failed.');
    } finally {
      clearTimeout(timeoutId);
      setLoadingCandles(false);
    }
  };

  const livePriceCache = React.useRef({});

  const fetchLiveQuote = async (symbol = selectedStock) => {
    if (!symbol) return;
    try {
      const res = await fetch(`${API_BASE}/api/quote/${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.price !== null && data.price !== undefined) {
          const px = parseFloat(data.price);
          const symUpper = String(symbol).toUpperCase().trim();
          livePriceCache.current[symUpper] = px;
          setCurrentQuote({ price: px, change_pct: data.change_pct, time: data.time, symbol: symUpper });
          setMarketDataSource(data.source || 'broker_api');
          setMarketDataError(null);
        }
      }
    } catch (e) {
      console.warn(`Quote update failed for ${symbol}`);
    }
  };

  const fetchActivePositionQuotes = async () => {
    const activeSymbols = Array.from(new Set((trades || []).filter(t => t && t.status === 'EXECUTED').map(t => String(t.symbol || '').toUpperCase().trim())));
    if (activeSymbols.length === 0) return;

    for (const sym of activeSymbols) {
      try {
        const res = await fetch(`${API_BASE}/api/quote/${encodeURIComponent(sym)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.price !== null && data.price !== undefined) {
            const px = parseFloat(data.price);
            livePriceCache.current[sym] = px;
            setStockList((prev) => {
              if (!prev || prev.length === 0) return prev;
              return prev.map(s => {
                if (String(s.symbol || '').toUpperCase().trim() === sym) {
                  return { ...s, price: px, change_pct: data.change_pct };
                }
                return s;
              });
            });
          }
        }
      } catch (e) {
        // quiet catch
      }
    }
  };

  const [apiKeys, setApiKeys] = useState({});

  

  
      }
    } catch (e) {
      console.error("Error saving keys:", e);
      return { success: false, error: String(e) };
    }
  };

  const [marketStatus, setMarketStatus] = useState({ is_open: false, session: 'AMO_OFF_MARKET_QUEUED', next_open: '09:15 AM IST' });

  const fetchMarketStatus = async () => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
      const parts = formatter.formatToParts(now);
      const getPart = (type) => parts.find(p => p.type === type)?.value;
      
      const hour = parseInt(getPart('hour'), 10);
      const minute = parseInt(getPart('minute'), 10);
      const weekday = getPart('weekday');
      
      let is_open = false;
      let session = 'CLOSED';
      let next_open = '09:15 AM IST';
      
      if (weekday === 'Sat' || weekday === 'Sun') {
        session = 'WEEKEND';
      } else {
        const timeNum = hour * 100 + minute;
        if (timeNum >= 915 && timeNum < 1530) {
          is_open = true;
          session = 'REGULAR';
        } else if (timeNum >= 900 && timeNum < 915) {
          session = 'PRE_OPEN';
        } else {
          session = 'CLOSED';
        }
      }

      setMarketStatus({
        is_open,
        session,
        next_open,
        timestamp: now.toISOString(),
        source: isDemoMode ? 'SIMULATED' : 'LIVE_API'
      });
    } catch (e) {
      console.warn("Failed to set market status", e);
    }
  };

  useEffect(() => {
    fetchStockList();
    fetchPortfolio(userId);
    fetchTrades(userId);
    
    fetchMarketStatus();
  }, [userId]);

  useEffect(() => {
    fetchCandles(selectedStock, timeframe);
    fetchLiveQuote(selectedStock);
  }, [selectedStock, timeframe]);

  // Institutional WebSocket Streaming Connection (Redis PubSub & Kafka Stream)
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;
    let isMounted = true;

    const connectWebSocket = () => {
      try {
        const wsUrl = API_BASE ? API_BASE.replace("http", "ws") + "/ws/stream" : 'ws://127.0.0.1:8000/ws/stream';

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[FinAI Stream] WebSocket connection established.');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TICK' && data.symbol === selectedStock) {
              const chg = data.change_pct !== undefined && data.change_pct !== null ? Number(data.change_pct) : 0.0;
              setCurrentQuote((prev) => ({
                ...prev,
                price: Number(data.price),
                change_pct: chg,
                symbol: data.symbol
              }));
            } else if (data.type === 'TRADE_EXECUTED' || data.type === 'TRADE_CLOSED' || data.type === 'SL_TP_TRIGGERED') {
              fetchTrades(userId);
              fetchPortfolio(userId);
            }
          } catch (e) {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (err) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [selectedStock, userId]);

  // Gentle fallback heartbeat polling
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      fetchLiveQuote(selectedStock);
      fetchActivePositionQuotes();
      fetchMarketStatus();
      fetchPortfolio(userId);
    }, 8000);

    const stockListInterval = setInterval(() => {
      fetchStockList();
    }, 20000);

    const candleInterval = setInterval(() => {
      fetchCandles(selectedStock, timeframe);
    }, 10000);

    return () => {
      clearInterval(quoteInterval);
      clearInterval(stockListInterval);
      clearInterval(candleInterval);
    };
  }, [selectedStock, timeframe, userId, trades.length]);

  // Cooling-off countdown handler
  useEffect(() => {
    if (coolingOffTimer !== null && coolingOffTimer > 0) {
      const interval = setInterval(() => {
        setCoolingOffTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [coolingOffTimer]);

  // Tilt Mode countdown handler
  useEffect(() => {
    if (isTiltMode && tiltModeTimeLeft > 0) {
      const interval = setInterval(() => {
        setTiltModeTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTiltMode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTiltMode, tiltModeTimeLeft]);

  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
    fetchLiveQuote(symbol);
    fetchCandles(symbol, timeframe);
  };

  // Evaluate order ticket before executing
  const handleEvaluateAndOrder = async (orderParams) => {
    // 1. Tilt-Mode Auto-Lockdown Check (3 consecutive losses + increasing size)
    const closedTrades = trades.filter(t => t.status === 'CLOSED').sort((a, b) => new Date(b.exit_timestamp || b.timestamp) - new Date(a.exit_timestamp || a.timestamp));
    if (closedTrades.length >= 3) {
      const last3 = closedTrades.slice(0, 3);
      const allLosses = last3.every(t => parseFloat(t.pnl) < 0);
      if (allLosses) {
        const avgSize = last3.reduce((sum, t) => sum + (t.quantity * t.price), 0) / 3;
        const currentSize = orderParams.quantity * orderParams.price;
        if (currentSize > avgSize * 1.1) {
          setIsTiltMode(true);
          setTiltModeTimeLeft(15 * 60); // 15 minutes
          return { success: false, error: 'TILT_MODE_ACTIVATED', message: 'Revenge Trading Detected.' };
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/trade/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderParams)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.risk_evaluation.has_risk) {
          setActiveXaiReceipt(data.xai_receipt);
          setPendingTrade(orderParams);
          return { risk_flagged: true, receipt: data.xai_receipt };
        } else {
          return await executeTradeDirectly(orderParams);
        }
      }
      return await executeTradeDirectly(orderParams);
    } catch (e) {
      return await executeTradeDirectly(orderParams);
    }
  };

  const executeTradeDirectly = async (orderParams, acceptCoolingOff = false) => {
    if (isDemoMode) {
      const tradeCode = `DEMO_TRD_${Date.now()}`;
      const trade = {
        trade_code: tradeCode,
        symbol: orderParams.symbol,
        side: orderParams.side,
        quantity: parseInt(orderParams.quantity),
        price: parseFloat(orderParams.price),
        status: 'EXECUTED',
        timestamp: new Date().toISOString()
      };
      const cost = trade.quantity * trade.price;
      
      if (trade.side === 'BUY' && portfolio.cash_balance < cost) {
        return { success: false, error: 'Insufficient cash in Demo Account.' };
      }

      setTrades(prev => [trade, ...prev]);
      if (trade.side === 'BUY') {
        setPortfolio(prev => ({
          ...prev,
          cash_balance: prev.cash_balance - cost,
          invested: prev.invested + cost
        }));
      } else {
        setPortfolio(prev => ({
          ...prev,
          cash_balance: prev.cash_balance + cost,
        }));
      }
      return { success: true, trade };
    }

    try {
      const res = await fetch(`${API_BASE}/api/trade/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...orderParams, accept_cooling_off: acceptCoolingOff })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'PAUSED_COOLING_OFF') {
          setCoolingOffTimer(20 * 60);
          setActiveXaiReceipt(null);
          setPendingTrade(null);
          fetchPortfolio();
          return { success: true, message: data.message };
        } else if (data.status === 'AMO_QUEUED') {
          if (data.trade) {
            setTrades(prev => [data.trade, ...(prev || []).filter(t => t.trade_code !== data.trade.trade_code)]);
          }
          fetchPortfolio();
          fetchTrades();
          setActiveXaiReceipt(null);
          setPendingTrade(null);
          return { success: true, is_amo: true, message: data.message, trade: data.trade };
        } else {
          if (data.trade) {
            setTrades(prev => [data.trade, ...(prev || []).filter(t => t.trade_code !== data.trade.trade_code)]);
          }
          fetchPortfolio();
          fetchTrades();
          setActiveXaiReceipt(null);
          setPendingTrade(null);
          return { success: true, trade: data.trade };
        }
      } else {
        const errorData = await res.json().catch(() => ({ detail: 'Trade execution failed.' }));
        return { success: false, error: errorData.detail || 'Trade execution failed.' };
      }
    } catch (e) {
      console.error("Trade execution error:", e);
      return { success: false, error: e.message || 'Network error executing trade.' };
    }
  };

  const closeTrade = async (tradeCode, exitPrice = null) => {
    if (isDemoMode) {
      let targetTrade = trades.find(t => t.trade_code === tradeCode);
      if (!targetTrade) return { success: false, error: 'Trade not found.' };
      
      const px = exitPrice ? parseFloat(exitPrice) : (parseFloat(currentQuote?.price) || targetTrade.price);
      const closedTrade = { ...targetTrade, status: 'CLOSED', exit_price: px, closed_at: new Date().toISOString() };
      
      const entryCost = targetTrade.quantity * targetTrade.price;
      const exitVal = targetTrade.quantity * px;
      let realized = 0;
      if (targetTrade.side === 'BUY') {
        realized = exitVal - entryCost;
      } else {
        realized = entryCost - exitVal;
      }

      setTrades(prev => prev.map(t => t.trade_code === tradeCode ? closedTrade : t));
      setPortfolio(prev => {
        let newCash = prev.cash_balance;
        if (targetTrade.side === 'BUY') {
           newCash += exitVal;
        } else {
           newCash -= exitVal;
        }
        return {
          ...prev,
          cash_balance: newCash,
          realized_pnl: (prev.realized_pnl || 0) + realized
        };
      });
      return { success: true, trade: closedTrade };
    }

    try {
      const res = await fetch(`${API_BASE}/api/trade/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade_code: tradeCode, exit_price: exitPrice ? parseFloat(exitPrice) : null })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchPortfolio();
        await fetchTrades();
        return { success: true, trade: data.trade };
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to square off trade.' }));
        return { success: false, error: err.detail || 'Failed to square off trade.' };
      }
    } catch (e) {
      console.error("Error closing trade:", e);
      return { success: false, error: e.message || 'Network error closing trade.' };
    }
  };

  const seedDemoData = async () => {
    try {
      setDemoInitializationState('INITIALIZING');
      setIsDemoMode(true);
      // Wait to simulate network initialization and show loading states
      await new Promise(r => setTimeout(r, 1500));
      
      setPortfolio({
        cash_balance: 100000.0,
        initial_balance: 100000.0,
        invested: 0.0,
        total_value: 100000.0,
        total_pnl: 0.0,
        unrealized_pnl: 0.0,
        open_trades_count: 0
      });
      setTrades([]);
      setDemoInitializationState('ACTIVE');
      fetchMarketStatus();
    } catch (e) {
      console.error("Demo seed error:", e);
      setDemoInitializationState('ERROR');
    }
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    setDemoInitializationState('IDLE');
    setTrades([]);
    fetchPortfolio(userId);
    fetchTrades(userId);
  };

  // Compute sub-second real-time Unrealized P&L and total portfolio value in browser
  const computedPortfolio = React.useMemo(() => {
    const activeTrades = (trades || []).filter((t) => t && t.status === 'EXECUTED');
    if (!activeTrades || activeTrades.length === 0) {
      return portfolio || { cash_balance: 100000.0, initial_balance: 100000.0, invested: 0.0, total_value: 100000.0, total_pnl: 0.0, unrealized_pnl: 0.0, open_trades_count: 0 };
    }

    let unrealized = 0;
    let openPositionsVal = 0;

    activeTrades.forEach((t) => {
      const entryPx = parseFloat(t.price || 0);
      const qty = parseInt(t.quantity || 0);
      let livePx = entryPx;

      const tSym = String(t.symbol || '').toUpperCase().trim();
      const qSym = String(currentQuote?.symbol || '').toUpperCase().trim();

      const cachedPx = livePriceCache.current[tSym];
      if (tSym === qSym && currentQuote?.price && parseFloat(currentQuote.price) > 0) {
        livePx = parseFloat(currentQuote.price);
        livePriceCache.current[tSym] = livePx;
      } else if (cachedPx && cachedPx > 0) {
        livePx = cachedPx;
      } else if (stockList && stockList.length > 0) {
        const found = (stockList || []).find((s) => String(s.symbol || '').toUpperCase().trim() === tSym);
        if (found && found.price && parseFloat(found.price) > 0) {
          livePx = parseFloat(found.price);
          livePriceCache.current[tSym] = livePx;
        }
      }

      const posVal = qty * livePx;

      let pnl = 0;
      if (t.side === 'BUY') {
        pnl = (livePx - entryPx) * qty;
        openPositionsVal += posVal;
      } else {
        pnl = (entryPx - livePx) * qty;
        openPositionsVal += ((qty * entryPx) + pnl);
      }
      unrealized += pnl;

      // Auto SL/TP execution check
      if (t.trade_code) {
        const sl = t.stop_loss !== null && t.stop_loss !== undefined ? parseFloat(t.stop_loss) : null;
        const tp = t.take_profit !== null && t.take_profit !== undefined ? parseFloat(t.take_profit) : null;
        if (sl !== null || tp !== null) {
          let hit = false;
          if (t.side === 'BUY') {
            if (sl !== null && livePx <= sl) hit = true;
            if (tp !== null && livePx >= tp) hit = true;
          } else {
            if (sl !== null && livePx >= sl) hit = true;
            if (tp !== null && livePx <= tp) hit = true;
          }
          if (hit) {
            closeTrade(t.trade_code, livePx);
          }
        }
      }
    });

    const roundedUnrealized = Math.round(unrealized * 100) / 100;
    const initial = portfolio?.initial_balance || 100000;
    const realized = portfolio?.realized_pnl || 0;
    const totalPnL = Math.round((realized + roundedUnrealized) * 100) / 100;
    const totalVal = Math.round((initial + totalPnL) * 100) / 100;

    return {
      ...portfolio,
      unrealized_pnl: roundedUnrealized,
      open_positions_value: Math.round(openPositionsVal * 100) / 100,
      total_pnl: totalPnL,
      total_value: totalVal,
      open_trades_count: activeTrades.length
    };
  }, [portfolio, trades, currentQuote, stockList, selectedStock]);

  const unlockTiltMode = () => {
    setIsTiltMode(false);
    setTiltModeTimeLeft(0);
  };

  return (
    <TradingContext.Provider
      value={{
        isTiltMode,
        tiltModeTimeLeft,
        unlockTiltMode,
        selectedStock,
        setSelectedStock: handleStockSelect,
        timeframe,
        setTimeframe,
        portfolio: computedPortfolio,
        tradeCount,
        profileUnlocked,
        disciplineScore,
        trades,
        activeTab,
        setActiveTab,
        stockList,
        candles,
        currentQuote,
        marketDataSource,
        marketDataError,
        marketStatus,
        loadingCandles,
        activeXaiReceipt,
        setActiveXaiReceipt,
        pendingTrade,
        coolingOffTimer,
        apiKeys,
        saveApiKeys,
        fetchApiKeys,
        handleEvaluateAndOrder,
        executeTradeDirectly,
        closeTrade,
        seedDemoData,
        isDemoMode,
        demoInitializationState,
        exitDemo,
        refreshCandles: () => fetchCandles(selectedStock, timeframe)
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => useContext(TradingContext);
