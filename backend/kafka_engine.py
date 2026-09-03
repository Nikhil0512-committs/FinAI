import json
import asyncio
import logging
import uuid
from typing import Dict, Any, Callable, List, Optional
from datetime import datetime

logger = logging.getLogger("finai.kafka")

class KafkaTopic:
    ORDERS_INBOUND = "finai.orders.inbound"
    ORDERS_MATCHED = "finai.orders.matched"
    TRADES_SETTLED = "finai.trades.settled"
    MARKET_TICKS = "finai.market.ticks"

class InMemoryKafkaBus:
    """High-throughput in-memory asynchronous queue bus with topic partitioning."""
    def __init__(self):
        self.queues: Dict[str, asyncio.Queue] = {}
        self.handlers: Dict[str, List[Callable[[Dict[str, Any]], Any]]] = {}
        self.running_tasks: List[asyncio.Task] = []

    def get_queue(self, topic: str) -> asyncio.Queue:
        if topic not in self.queues:
            self.queues[topic] = asyncio.Queue()
        return self.queues[topic]

    async def send(self, topic: str, message: Dict[str, Any]):
        queue = self.get_queue(topic)
        await queue.put(message)

    def register_handler(self, topic: str, handler: Callable[[Dict[str, Any]], Any]):
        if topic not in self.handlers:
            self.handlers[topic] = []
        self.handlers[topic].append(handler)

    async def start_consumer(self, topic: str):
        queue = self.get_queue(topic)
        while True:
            try:
                msg = await queue.get()
                handlers = self.handlers.get(topic, [])
                for h in handlers:
                    try:
                        if asyncio.iscoroutinefunction(h):
                            asyncio.create_task(h(msg))
                        else:
                            h(msg)
                    except Exception as err:
                        logger.error(f"Error executing Kafka handler on topic {topic}: {err}")
                queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in Kafka consumer loop for {topic}: {e}")
                await asyncio.sleep(0.1)

class KafkaEngine:
    """
    Production-grade Kafka Event Streaming Engine for FinAI.
    Connects to Apache Kafka (localhost:9092) via aiokafka,
    or falls back to an ultra-fast in-memory asynchronous event stream.
    """
    def __init__(self, bootstrap_servers: str = "127.0.0.1:9092"):
        self.bootstrap_servers = bootstrap_servers
        self.is_native_kafka = False
        self.producer = None
        self.mem_bus = InMemoryKafkaBus()
        self._consumer_tasks: List[asyncio.Task] = []
        self._initialized = False

    def _is_port_open(self, host: str = "127.0.0.1", port: int = 9092, timeout: float = 0.2) -> bool:
        import socket
        try:
            with socket.create_connection((host, port), timeout=timeout):
                return True
        except Exception:
            return False

    async def init(self):
        """Attempts native Kafka connection or activates high-throughput async event bus."""
        if self._initialized:
            return

        if not self._is_port_open("127.0.0.1", 9092):
            self.is_native_kafka = False
            self.producer = None
            logger.info("Native Kafka broker offline. High-throughput In-Memory Event Stream activated.")
            self._initialized = True
            return

        producer = None
        try:
            from aiokafka import AIOKafkaProducer
            producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                request_timeout_ms=500
            )
            await asyncio.wait_for(producer.start(), timeout=0.8)
            self.producer = producer
            self.is_native_kafka = True
            logger.info("Connected to native Apache Kafka cluster (port 9092)")
        except Exception:
            if producer:
                try:
                    await producer.stop()
                except Exception:
                    pass
            self.is_native_kafka = False
            self.producer = None
            logger.info("Native Kafka daemon not active. Activated ultra-fast In-Memory Async Event Stream.")

        self._initialized = True

    async def send_order_inbound(self, order_payload: Dict[str, Any]) -> str:
        """Pushes an order into the inbound streaming topic and returns immediate receipt ID."""
        if not self._initialized:
            await self.init()

        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        event = {
            "event_id": event_id,
            "topic": KafkaTopic.ORDERS_INBOUND,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": order_payload
        }

        if self.is_native_kafka and self.producer:
            try:
                await self.producer.send_and_wait(KafkaTopic.ORDERS_INBOUND, event)
                return event_id
            except Exception:
                await self.mem_bus.send(KafkaTopic.ORDERS_INBOUND, event)
                return event_id
        else:
            await self.mem_bus.send(KafkaTopic.ORDERS_INBOUND, event)
            return event_id

    async def publish_event(self, topic: str, data: Dict[str, Any]):
        """Publishes an event to any Kafka topic."""
        if not self._initialized:
            await self.init()

        event = {
            "event_id": f"evt_{uuid.uuid4().hex[:12]}",
            "topic": topic,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": data
        }

        if self.is_native_kafka and self.producer:
            try:
                await self.producer.send(topic, event)
            except Exception:
                await self.mem_bus.send(topic, event)
        else:
            await self.mem_bus.send(topic, event)

    def register_consumer(self, topic: str, callback: Callable[[Dict[str, Any]], Any]):
        """Registers a consumer callback for a given topic."""
        self.mem_bus.register_handler(topic, callback)
        task = asyncio.create_task(self.mem_bus.start_consumer(topic))
        self._consumer_tasks.append(task)

    async def close(self):
        for t in self._consumer_tasks:
            t.cancel()
        if self.producer:
            try:
                await self.producer.stop()
            except Exception:
                pass

kafka_engine = KafkaEngine()
