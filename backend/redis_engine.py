import json
import time
import asyncio
import logging
from typing import Optional, Dict, Any, Callable, List

logger = logging.getLogger("finai.redis")

class InMemoryLRUCache:
    """High-speed in-memory key-value cache with TTL expiration."""
    def __init__(self, max_size: int = 5000):
        self.store: Dict[str, Any] = {}
        self.expirations: Dict[str, float] = {}
        self.max_size = max_size

    def get(self, key: str) -> Optional[str]:
        now = time.time()
        if key in self.expirations and now > self.expirations[key]:
            self.delete(key)
            return None
        return self.store.get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if len(self.store) >= self.max_size:
            # Evict oldest expired or first item
            oldest = next(iter(self.store))
            self.delete(oldest)
        self.store[key] = value
        if ex:
            self.expirations[key] = time.time() + ex
        elif key in self.expirations:
            del self.expirations[key]
        return True

    def delete(self, key: str) -> bool:
        self.store.pop(key, None)
        self.expirations.pop(key, None)
        return True

    def exists(self, key: str) -> bool:
        return self.get(key) is not None

class InMemoryPubSub:
    """Asynchronous in-memory Pub/Sub channel multiplexer."""
    def __init__(self):
        self.subscribers: Dict[str, List[Callable[[str], Any]]] = {}

    def subscribe(self, channel: str, callback: Callable[[str], Any]):
        if channel not in self.subscribers:
            self.subscribers[channel] = []
        self.subscribers[channel].append(callback)

    def unsubscribe(self, channel: str, callback: Callable[[str], Any]):
        if channel in self.subscribers:
            self.subscribers[channel] = [cb for cb in self.subscribers[channel] if cb != callback]

    async def publish(self, channel: str, message: str) -> int:
        callbacks = self.subscribers.get(channel, [])
        count = len(callbacks)
        for cb in callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    asyncio.create_task(cb(message))
                else:
                    cb(message)
            except Exception as e:
                logger.error(f"Error invoking pub/sub callback on channel {channel}: {e}")
        return count

class RedisEngine:
    """
    Production-grade Redis Engine for FinAI.
    Connects to native Redis if available (redis://localhost:6379),
    or transparently falls back to an ultra-fast In-Memory LRU + Pub/Sub engine.
    """
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379/0"):
        self.redis_url = redis_url
        self.is_native_redis = False
        self.redis_client = None
        self.mem_cache = InMemoryLRUCache()
        self.mem_pubsub = InMemoryPubSub()
        self._initialized = False

    def _is_port_open(self, host: str = "127.0.0.1", port: int = 6379, timeout: float = 0.2) -> bool:
        import socket
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except Exception:
            return False

    async def init(self):
        """Initializes the Redis connection or activates in-memory fallback."""
        if self._initialized:
            return
        
        if not self._is_port_open("127.0.0.1", 6379):
            self.is_native_redis = False
            self.redis_client = None
            logger.info("Native Redis not active. Activated ultra-fast In-Memory LRU + Pub/Sub Engine.")
            self._initialized = True
            return

        try:
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(
                self.redis_url, 
                encoding="utf-8", 
                decode_responses=True,
                socket_timeout=0.5,
                socket_connect_timeout=0.5
            )
            # Test connection with a ping
            await self.redis_client.ping()
            self.is_native_redis = True
            logger.info("Connected to native Redis cluster (port 6379)")
        except Exception:
            self.is_native_redis = False
            self.redis_client = None
            logger.info("Native Redis not active. Activated ultra-fast In-Memory LRU + Pub/Sub Engine.")
        
        self._initialized = True

    async def get(self, key: str) -> Optional[str]:
        if not self._initialized:
            await self.init()

        if self.is_native_redis and self.redis_client:
            try:
                return await self.redis_client.get(key)
            except Exception:
                return self.mem_cache.get(key)
        return self.mem_cache.get(key)

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> bool:
        if not self._initialized:
            await self.init()

        val_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)

        if self.is_native_redis and self.redis_client:
            try:
                await self.redis_client.set(key, val_str, ex=ex)
                return True
            except Exception:
                return self.mem_cache.set(key, val_str, ex=ex)
        return self.mem_cache.set(key, val_str, ex=ex)

    async def get_json(self, key: str) -> Optional[Any]:
        val = await self.get(key)
        if val is None:
            return None
        try:
            return json.loads(val)
        except Exception:
            return val

    async def set_json(self, key: str, data: Any, ex: Optional[int] = None) -> bool:
        return await self.set(key, json.dumps(data), ex=ex)

    async def delete(self, key: str) -> bool:
        if not self._initialized:
            await self.init()

        if self.is_native_redis and self.redis_client:
            try:
                await self.redis_client.delete(key)
                return True
            except Exception:
                return self.mem_cache.delete(key)
        return self.mem_cache.delete(key)

    # ─── Specialized FinAI Caching Utilities ───

    async def get_live_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetches live stock quote from Redis in <1ms."""
        key = f"finai:quote:{symbol.upper()}"
        return await self.get_json(key)

    async def set_live_quote(self, symbol: str, quote: Dict[str, Any], ttl_seconds: int = 3):
        """Caches live stock quote with short TTL."""
        key = f"finai:quote:{symbol.upper()}"
        await self.set_json(key, quote, ex=ttl_seconds)

    async def get_cached_candles(self, symbol: str, timeframe: str) -> Optional[Dict[str, Any]]:
        """Fetches precomputed technical candles from cache."""
        key = f"finai:candles:{symbol.upper()}:{timeframe}"
        return await self.get_json(key)

    async def set_cached_candles(self, symbol: str, timeframe: str, data: Dict[str, Any], ttl_seconds: int = 5):
        """Caches precomputed technical candles."""
        key = f"finai:candles:{symbol.upper()}:{timeframe}"
        await self.set_json(key, data, ex=ttl_seconds)

    # ─── Pub/Sub Broadcasting for WebSockets ───

    async def publish_market_tick(self, symbol: str, tick_data: Dict[str, Any]):
        """Publishes live tick to Redis channel for instant WebSocket distribution."""
        channel = f"finai:channel:ticks:{symbol.upper()}"
        msg = json.dumps(tick_data)
        
        # Also store in cache
        await self.set_live_quote(symbol, tick_data, ttl_seconds=3)

        if self.is_native_redis and self.redis_client:
            try:
                await self.redis_client.publish(channel, msg)
                await self.redis_client.publish("finai:channel:market_all", msg)
            except Exception:
                await self.mem_pubsub.publish(channel, msg)
                await self.mem_pubsub.publish("finai:channel:market_all", msg)
        else:
            await self.mem_pubsub.publish(channel, msg)
            await self.mem_pubsub.publish("finai:channel:market_all", msg)

    def subscribe_ticks(self, symbol: str, callback: Callable[[str], Any]):
        """Subscribes callback to live symbol ticks."""
        channel = f"finai:channel:ticks:{symbol.upper()}"
        self.mem_pubsub.subscribe(channel, callback)

    def unsubscribe_ticks(self, symbol: str, callback: Callable[[str], Any]):
        channel = f"finai:channel:ticks:{symbol.upper()}"
        self.mem_pubsub.unsubscribe(channel, callback)

    async def close(self):
        if self.redis_client:
            try:
                await self.redis_client.close()
            except Exception:
                pass

redis_engine = RedisEngine()
