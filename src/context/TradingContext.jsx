import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || "";

const DEFAULT_TOP_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 1186.40, change_pct: 1.60, open: 1171.20, high: 1193.00, low: 1171.20, prev_close: 1167.70, volume: 14251054, range: '₹1,171.20 - ₹1,193.00', exchange: 'NSE', sector: 'Energy & Conglomerate' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 2114.40, change_pct: 1.90, open: 2114.00, high: 2140.90, low: 2063.60, prev_close: 2075.00, volume: 5269742, range: '₹2,063.60 - ₹2,140.90', exchange: 'NSE', sector: 'IT Software & Cloud' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 704.80, change_pct: -2.27, open: 731.95, high: 734.20, low: 701.25, prev_close: 721.20, volume: 66035588, range: '₹701.25 - ₹734.20', exchange: 'NSE', sector: 'Banking & Financial Services' },
  { symbol: 'INFY', name: 'Infosys Ltd.', price: 1020.50, change_pct: -1.40, open: 1030.00, high: 1033.40, low: 1015.00, prev_close: 1035.00, volume: 8431000, range: '₹1,015.00 - ₹1,033.40', exchange: 'NSE', sector: 'IT Software & Digital' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 1332.00, change_pct: 1.63, open: 1318.00, high: 1335.80, low: 1312.00, prev_close: 1310.60, volume: 16400000, range: '₹1,312.00 - ₹1,335.80', exchange: 'NSE', sector: 'Banking & Financial Services' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', price: 2864.00, change_pct: 1.68, open: 2820.00, high: 2878.00, low: 2815.00, prev_close: 2816.80, volume: 2410000, range: '₹2,815.00 - ₹2,878.00', exchange: 'NSE', sector: 'Metals & Energy' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Passenger Vehicles Ltd.', price: 288.65, change_pct: 3.31, open: 281.00, high: 290.40, low: 280.00, prev_close: 279.40, volume: 22100000, range: '₹280.00 - ₹290.40', exchange: 'NSE', sector: 'Automotive & EV' },
  { symbol: 'SBIN', name: 'State Bank of India', price: 958.00, change_pct: 0.41, open: 955.00, high: 964.50, low: 952.10, prev_close: 954.10, volume: 15400000, range: '₹952.10 - ₹964.50', exchange: 'NSE', sector: 'Public Banking' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1779.90, change_pct: 2.23, open: 1745.00, high: 1785.00, low: 1740.00, prev_close: 1741.00, volume: 4900000, range: '₹1,740.00 - ₹1,785.00', exchange: 'NSE', sector: 'Telecommunications' },
  { symbol: 'ITC', name: 'ITC Ltd.', price: 268.90, change_pct: 5.08, open: 256.00, high: 270.20, low: 255.50, prev_close: 255.90, volume: 38200000, range: '₹255.50 - ₹270.20', exchange: 'NSE', sector: 'FMCG & Diversified' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', price: 3750.00, change_pct: 1.53, open: 3700.00, high: 3768.00, low: 3690.00, prev_close: 3693.50, volume: 2100000, range: '₹3,690.00 - ₹3,768.00', exchange: 'NSE', sector: 'Infrastructure & Engineering' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 416.00, change_pct: -0.56, open: 419.00, high: 422.00, low: 414.50, prev_close: 418.35, volume: 7200000, range: '₹414.50 - ₹422.00', exchange: 'NSE', sector: 'Banking & Financials' },
  { symbol: 'PNB', name: 'Punjab National Bank', price: 112.35, change_pct: 2.54, open: 110.65, high: 113.58, low: 110.50, prev_close: 109.57, volume: 12282075, range: '₹110.50 - ₹113.58', exchange: 'NSE', sector: 'Public Banking' },
  { symbol: 'IRCTC', name: 'IRCTC Ltd.', price: 452.80, change_pct: -0.29, open: 454.15, high: 464.60, low: 448.05, prev_close: 454.10, volume: 1583401, range: '₹448.05 - ₹464.60', exchange: 'NSE', sector: 'Travel & Tourism' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd.', price: 4031.00, change_pct: 0.25, open: 4026.00, high: 4040.50, low: 3919.00, prev_close: 4021.00, volume: 706513, range: '₹3,919.00 - ₹4,040.50', exchange: 'NSE', sector: 'Automotive' },
  { symbol: 'ZOMATO', name: 'Zomato Ltd.', price: 320.80, change_pct: 2.20, open: 308.95, high: 322.85, low: 308.10, prev_close: 313.90, volume: 31032015, range: '₹308.10 - ₹322.85', exchange: 'NSE', sector: 'Online Delivery & Tech' },
];

const TradingContext = createContext();

export const TradingProvider = ({ children }) => {
  const { user, userId, token, setIsAuthModalOpen } = useAuth();
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
  const [activeTab, setActiveTab] = useState('terminal'); // terminal | intelligence | scorecard | replay | orders | watchlist
  const [stockList, setStockList] = useState(DEFAULT_TOP_STOCKS);
  const [watchlist, setWatchlist] = useState([]);
  const [candles, setCandles] = useState([]);
  const [currentQuote, setCurrentQuote] = useState({
    price: 2864.00,
    change_pct: 1.68,
    open: 2820.00,
    high: 2878.00,
    low: 2815.00,
    day_high: 2878.00,
    day_low: 2815.00,
    prev_close: 2816.80,
    volume: 2410000,
    range: '₹2,815.00 - ₹2,878.00',
    time: null,
    symbol: 'ADANIENT'
  });
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
  const fetchPortfolio = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/portfolio`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

  const fetchTrades = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/trades`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        if (data.stocks && data.stocks.length > 0) {
          setStockList((prev) => {
            const prevMap = new Map((prev || []).map((s) => [s.symbol, s]));
            return data.stocks.map((stock) => {
              const old = prevMap.get(stock.symbol);
              const isFallback = stock.source === 'static_fallback' || stock.source === 'fallback';
              const oldHasValidPrice = old && old.price && old.source !== 'static_fallback' && old.source !== 'fallback';
              
              if (isFallback && oldHasValidPrice) {
                return old;
              }

              const px = stock.price !== undefined && stock.price !== null ? stock.price : old?.price;
              const chg = stock.change_pct !== undefined && stock.change_pct !== null ? stock.change_pct : old?.change_pct;
              if (px) livePriceCache.current[stock.symbol] = px;
              return {
                ...old,
                ...stock,
                price: px,
                change_pct: chg,
                open: stock.open || old?.open || px,
                high: stock.high || stock.day_high || old?.high || px,
                low: stock.low || stock.day_low || old?.low || px,
                day_high: stock.day_high || stock.high || old?.day_high || px,
                day_low: stock.day_low || stock.low || old?.day_low || px,
                prev_close: stock.prev_close || old?.prev_close || px,
                volume: stock.volume || old?.volume || 0,
                range: stock.range || old?.range,
                source: stock.source || old?.source
              };
            });
          });
        }
      }
    } catch (e) {
      console.warn("Base stock list fetch error:", e);
    }
  };

  const fetchWatchlist = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/watchlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (e) {
      console.warn("Watchlist fetch error:", e);
    }
  };

  const toggleWatchlist = async (symbol) => {
    if (!token) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      return;
    }
    const isWatched = watchlist.includes(symbol);
    
    // Optimistic UI update
    setWatchlist(prev => 
      isWatched ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );

    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/watchlist${isWatched ? `/${symbol}` : ''}`, {
        method: isWatched ? 'DELETE' : 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: isWatched ? undefined : JSON.stringify({ symbol })
      });
      
      if (!res.ok) {
        // Revert on failure
        fetchWatchlist();
      }
    } catch (e) {
      console.error("Watchlist toggle error:", e);
      fetchWatchlist();
    }
  };

  const fetchCandles = async (symbol, tf = timeframe) => {
    setLoadingCandles(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${API_BASE}/api/candles/${encodeURIComponent(symbol)}?timeframe=${tf}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setCandles(data.candles || []);
        if (data.candles && data.candles.length > 0) {
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
          const symUpper = String(symbol).toUpperCase().trim();
          
          if (data.source === 'static_fallback' || data.source === 'fallback') {
            setCurrentQuote(prevQuote => {
              if (prevQuote && prevQuote.symbol === symUpper && prevQuote.source !== 'static_fallback' && prevQuote.source !== 'fallback') {
                return prevQuote;
              }
              const px = parseFloat(data.price);
              livePriceCache.current[symUpper] = px;
              const quoteObj = {
                price: px,
                change_pct: data.change_pct,
                open: data.open ? parseFloat(data.open) : px,
                high: (data.day_high || data.high) ? parseFloat(data.day_high || data.high) : px,
                low: (data.day_low || data.low) ? parseFloat(data.day_low || data.low) : px,
                day_high: (data.day_high || data.high) ? parseFloat(data.day_high || data.high) : px,
                day_low: (data.day_low || data.low) ? parseFloat(data.day_low || data.low) : px,
                prev_close: data.prev_close ? parseFloat(data.prev_close) : px,
                volume: data.volume || 0,
                range: data.range || `₹${(data.low || px).toFixed(2)} - ₹${(data.high || px).toFixed(2)}`,
                high_52w: data.high_52w,
                low_52w: data.low_52w,
                time: data.time,
                symbol: symUpper,
                source: data.source
              };
              setMarketDataSource(data.source || 'broker_api');
              setMarketDataError(null);
              setStockList((prevList) => {
                if (!prevList || prevList.length === 0) return prevList;
                return prevList.map(s => String(s.symbol || '').toUpperCase().trim() === symUpper ? { ...s, ...quoteObj } : s);
              });
              return quoteObj;
            });
            return;
          }

          const px = parseFloat(data.price);
          livePriceCache.current[symUpper] = px;
          const quoteObj = {
            price: px,
            change_pct: data.change_pct,
            open: data.open ? parseFloat(data.open) : px,
            high: (data.day_high || data.high) ? parseFloat(data.day_high || data.high) : px,
            low: (data.day_low || data.low) ? parseFloat(data.day_low || data.low) : px,
            day_high: (data.day_high || data.high) ? parseFloat(data.day_high || data.high) : px,
            day_low: (data.day_low || data.low) ? parseFloat(data.day_low || data.low) : px,
            prev_close: data.prev_close ? parseFloat(data.prev_close) : px,
            volume: data.volume || 0,
            range: data.range || `₹${(data.low || px).toFixed(2)} - ₹${(data.high || px).toFixed(2)}`,
            high_52w: data.high_52w,
            low_52w: data.low_52w,
            time: data.time,
            symbol: symUpper
          };
          setCurrentQuote(quoteObj);
          setMarketDataSource(data.source || 'broker_api');
          setMarketDataError(null);
          // Keep stockList synchronized
          setStockList((prev) => {
            if (!prev || prev.length === 0) return prev;
            return prev.map(s => {
              if (String(s.symbol || '').toUpperCase().trim() === symUpper) {
                return { ...s, ...quoteObj };
              }
              return s;
            });
          });
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

  const fetchApiKeys = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || {});
      }
    } catch (e) {
      console.warn("Failed to fetch API keys");
    }
  };

  const saveApiKeys = async (payload) => {
    try {
      if (!token) return { success: false, error: 'Unauthorized' };
      const res = await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // await fetchApiKeys();
        return { success: true };
      }
    } catch (e) {
      console.error("Error saving keys:", e);
      return { success: false, error: String(e) };
    }
  };

  const [marketStatus, setMarketStatus] = useState({ is_open: false, session: 'AMO_OFF_MARKET_QUEUED', next_open: '09:15 AM IST' });
  const [marketIndices, setMarketIndices] = useState({
    nifty: { symbol: 'NIFTY', name: 'NIFTY 50', price: 22535.0, change_pct: 0.50 },
    banknifty: { symbol: 'BANKNIFTY', name: 'BANK NIFTY', price: 54675.85, change_pct: 0.41 }
  });

  const fetchMarketStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/market-status`);
      if (res.ok) {
        const data = await res.json();
        setMarketStatus(data);
        if (data.indices) {
          setMarketIndices(data.indices);
        }
      }
    } catch (e) {
      console.warn("Failed to set market status", e);
    }
  };

  useEffect(() => {
    fetchStockList();
    fetchWatchlist();
    fetchPortfolio(userId);
    fetchTrades(userId);
    // fetchApiKeys();
    fetchMarketStatus();
  }, [userId]);

  const wsRef = React.useRef(null);

  useEffect(() => {
    setCurrentQuote({ price: null, change_pct: null, time: null, symbol: selectedStock });
    fetchCandles(selectedStock, timeframe);
    fetchLiveQuote(selectedStock);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedStock) {
      try {
        wsRef.current.send(JSON.stringify({ action: 'SUBSCRIBE', symbol: selectedStock }));
      } catch (e) {}
    }
  }, [selectedStock, timeframe]);

  // Institutional WebSocket Streaming Connection (Redis PubSub & Kafka Stream)
  useEffect(() => {
    let reconnectTimeout = null;
    let isMounted = true;

    const getWsUrl = () => {
      if (API_BASE) {
        const base = API_BASE.replace(/^http/, 'ws').replace(/\/+$/, '');
        return `${base}/ws/stream`;
      }
      if (typeof window !== 'undefined' && window.location) {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${proto}//${window.location.host}/ws/stream`;
      }
      return 'ws://127.0.0.1:8000/ws/stream';
    };

    const connectWebSocket = () => {
      try {
        const wsUrl = getWsUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[FinAI Stream] WebSocket connection established.');
          if (selectedStock) {
            try {
              ws.send(JSON.stringify({ action: 'SUBSCRIBE', symbol: selectedStock }));
            } catch (e) {}
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TICK' && data.symbol) {
              const sym = String(data.symbol).toUpperCase().trim();
              const px = Number(data.price);
              const chg = data.change_pct !== undefined && data.change_pct !== null ? Number(data.change_pct) : 0.0;
              const o = data.open !== undefined ? Number(data.open) : px;
              const h = data.day_high !== undefined ? Number(data.day_high) : (data.high !== undefined ? Number(data.high) : px);
              const l = data.day_low !== undefined ? Number(data.day_low) : (data.low !== undefined ? Number(data.low) : px);
              const prevClose = data.prev_close !== undefined ? Number(data.prev_close) : px;
              const vol = data.volume !== undefined ? Number(data.volume) : 0;
              const range = data.range || `₹${l.toFixed(2)} - ₹${h.toFixed(2)}`;

              livePriceCache.current[sym] = px;

              // Keep all components using stockList in sync
              setStockList((prev) => {
                if (!prev || prev.length === 0) return prev;
                return prev.map(s => String(s.symbol || '').toUpperCase().trim() === sym ? {
                  ...s,
                  price: px,
                  change_pct: chg,
                  open: o,
                  high: h,
                  low: l,
                  day_high: h,
                  day_low: l,
                  prev_close: prevClose,
                  volume: vol,
                  range: range
                } : s);
              });

              if (sym === String(selectedStock).toUpperCase().trim()) {
                setCurrentQuote((prev) => ({
                  ...prev,
                  price: px,
                  change_pct: chg,
                  open: o,
                  high: h,
                  low: l,
                  day_high: h,
                  day_low: l,
                  prev_close: prevClose,
                  volume: vol,
                  range: range,
                  symbol: sym,
                  time: data.time || new Date().toLocaleTimeString('en-US', { hour12: false })
                }));
              }
            } else if (data.type === 'INDICES' && data.data) {
              setMarketIndices(data.data);
            } else if (data.type === 'TRADE_EXECUTED' || data.type === 'TRADE_CLOSED' || data.type === 'SL_TP_TRIGGERED') {
              if (data.user_id === userId) {
                 // We will update the state locally from the HTTP response, so we don't strictly need to fetch here.
                 // However, we can fetch optionally if there's a drift, but we'll disable it for instant snappiness.
              }
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
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId]);

  // Gentle fallback heartbeat polling
  useEffect(() => {
    const pnlInterval = setInterval(() => {
      fetchActivePositionQuotes();
    }, 15000);
    
    // We already get high-frequency updates via WebSocket, so we don't need 3-second HTTP polling.
    // Fetch quotes and market status every 15 seconds as a fallback instead of 3 seconds.
    const quoteInterval = setInterval(() => {
      fetchLiveQuote(selectedStock);
      fetchMarketStatus();
    }, 15000);

    const stockListInterval = setInterval(() => {
      fetchStockList();
    }, 60000);

    const candleInterval = setInterval(() => {
      fetchCandles(selectedStock, timeframe);
    }, 15000);

    return () => {
      clearInterval(pnlInterval);
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...orderParams, accept_cooling_off: acceptCoolingOff })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'PAUSED_COOLING_OFF') {
          setCoolingOffTimer(20 * 60);
          if (data.portfolio) setPortfolio(data.portfolio);
          if (data.trades) {
             setTrades(data.trades);
          } else if (data.trade) {
             setTrades(prev => [data.trade, ...(prev || []).filter(t => t.trade_code !== data.trade.trade_code)]);
          }
          setActiveXaiReceipt(null);
          setPendingTrade(null);
          return { success: true, trade: data.trade };
        } else if (data.status === 'AMO_QUEUED') {
          if (data.portfolio) setPortfolio(data.portfolio);
          if (data.trades) {
             setTrades(data.trades);
          } else if (data.trade) {
             setTrades(prev => [data.trade, ...(prev || []).filter(t => t.trade_code !== data.trade.trade_code)]);
          }
          setActiveXaiReceipt(null);
          setPendingTrade(null);
          return { success: true, is_amo: true, message: data.message, trade: data.trade };
        } else {
          if (data.portfolio) setPortfolio(data.portfolio);
          if (data.trades) {
             setTrades(data.trades);
          } else if (data.trade) {
             setTrades(prev => [data.trade, ...(prev || []).filter(t => t.trade_code !== data.trade.trade_code)]);
          }
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ trade_code: tradeCode, exit_price: exitPrice ? parseFloat(exitPrice) : null })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.portfolio) setPortfolio(data.portfolio);
        if (data.trades) setTrades(data.trades);
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
        marketIndices,
        loadingCandles,
        activeXaiReceipt,
        setActiveXaiReceipt,
        pendingTrade,
        coolingOffTimer,
        watchlist,
        toggleWatchlist,
        fetchWatchlist,
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
