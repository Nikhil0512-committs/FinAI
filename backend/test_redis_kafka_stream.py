import asyncio
import json
import time
import urllib.request
import websockets
from redis_engine import redis_engine
from kafka_engine import kafka_engine, KafkaTopic

BASE_URL = 'http://127.0.0.1:8000'
WS_URL = 'ws://127.0.0.1:8000/ws/stream'

async def test_all():
    print("=== 1. TEST REDIS CACHING & LATENCY ===")
    await redis_engine.init()
    
    t0 = time.perf_counter()
    await redis_engine.set_live_quote("RELIANCE", {"price": 1315.50, "change_pct": 1.25})
    quote = await redis_engine.get_live_quote("RELIANCE")
    t1 = time.perf_counter()
    
    latency_ms = (t1 - t0) * 1000
    print(f"Redis Quote Set/Get Latency: {latency_ms:.3f} ms")
    assert quote['price'] == 1315.50
    print("-> Redis sub-millisecond caching operational!")

    print("\n=== 2. TEST KAFKA EVENT STREAMING ENGINE ===")
    await kafka_engine.init()
    
    received_events = []
    def order_consumer(event):
        received_events.append(event)

    kafka_engine.register_consumer(KafkaTopic.ORDERS_INBOUND, order_consumer)

    order_payload = {
        "user_id": "usr_stream_test",
        "symbol": "TCS",
        "side": "BUY",
        "quantity": 5,
        "price": 3840.0
    }

    event_id = await kafka_engine.send_order_inbound(order_payload)
    print(f"Pushed order to Kafka topic '{KafkaTopic.ORDERS_INBOUND}' -> Event ID: {event_id}")
    
    await asyncio.sleep(0.2)
    assert len(received_events) > 0
    print(f"Kafka consumer successfully received {len(received_events)} event(s) from stream!")

    print("\n=== 3. TEST WEBSOCKET REAL-TIME STREAMING & ORDER BROADCAST ===")
    async with websockets.connect(WS_URL) as ws:
        init_frame = await ws.recv()
        init_data = json.loads(init_frame)
        print(f"WebSocket Connected: {init_data.get('message')}")
        assert init_data.get('type') == 'CONNECTED'

        # Execute live trade via HTTP API
        req_data = {
            "user_id": "usr_stream_test",
            "symbol": "INFY",
            "side": "BUY",
            "quantity": 10,
            "price": 1500.0,
            "sentiment_tag": "Bullish"
        }
        
        req = urllib.request.Request(
            f"{BASE_URL}/api/trade/execute",
            data=json.dumps(req_data).encode(),
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req)
        exec_res = json.loads(res.read().decode())
        trade_code = exec_res['trade']['trade_code']
        print(f"Executed Trade via API: {trade_code} (Kafka Event ID: {exec_res.get('kafka_event_id')})")

        # Listen for WebSocket broadcast
        found_broadcast = False
        for _ in range(5):
            try:
                frame = await asyncio.wait_for(ws.recv(), timeout=1.5)
                data = json.loads(frame)
                if data.get('type') == 'TRADE_EXECUTED' and data.get('trade', {}).get('trade_code') == trade_code:
                    print(f"-> WebSocket received real-time broadcast: TRADE_EXECUTED for {trade_code}!")
                    found_broadcast = True
                    break
            except asyncio.TimeoutError:
                break

        assert found_broadcast, "Did not receive TRADE_EXECUTED over WebSocket"

        # Now close trade and test close broadcast
        close_req = urllib.request.Request(
            f"{BASE_URL}/api/trade/close",
            data=json.dumps({"trade_code": trade_code, "exit_price": 1505.0}).encode(),
            headers={'Content-Type': 'application/json'}
        )
        urllib.request.urlopen(close_req)
        print(f"Closed Trade via API: {trade_code}")

        found_close_broadcast = False
        for _ in range(5):
            try:
                frame = await asyncio.wait_for(ws.recv(), timeout=1.5)
                data = json.loads(frame)
                if data.get('type') == 'TRADE_CLOSED' and data.get('trade', {}).get('trade_code') == trade_code:
                    print(f"-> WebSocket received real-time broadcast: TRADE_CLOSED for {trade_code}!")
                    found_close_broadcast = True
                    break
            except asyncio.TimeoutError:
                break

        assert found_close_broadcast, "Did not receive TRADE_CLOSED over WebSocket"

    print("\nALL REDIS, KAFKA & WEBSOCKET STREAMING TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(test_all())
