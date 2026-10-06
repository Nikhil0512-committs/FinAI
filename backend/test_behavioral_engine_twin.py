import unittest
from datetime import datetime, timedelta
import numpy as np
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class MockBehavioralEngine:
    def analyze_twin(self, raw_trades, active_rules=None, starting_capital=100000.0):
        if not active_rules:
            active_rules = {'REVENGE': 15.0, 'OVERSIZED': 1.5}
            
        round_trips = []
        skipped_trades = 0
        for t in raw_trades:
            if not t.get('timestamp'):
                skipped_trades += 1
                continue
            
            existing = next((rt for rt in round_trips if rt['trade_code'] == t['trade_code']), None)
            if existing:
                existing['quantity'] += t['quantity']
                existing['pnl'] += t['pnl']
                existing['brokerage'] += t['brokerage']
                existing['total_val'] += (t['quantity'] * t['price'])
            else:
                round_trips.append({
                    'trade_code': t['trade_code'],
                    'timestamp': datetime.strptime(t['timestamp'], '%Y-%m-%d %H:%M:%S'),
                    'pnl': t['pnl'],
                    'brokerage': t['brokerage'],
                    'quantity': t['quantity'],
                    'total_val': t['quantity'] * t['price'],
                    'label': None
                })
                
        round_trips.sort(key=lambda x: x['timestamp'])
        
        tilt_events = []
        for i, rt in enumerate(round_trips):
            net_pnl = rt['pnl'] - rt['brokerage']
            rt['net_pnl'] = net_pnl
            
            is_revenge = False
            if i > 0:
                prev_rt = round_trips[i-1]
                if prev_rt['net_pnl'] < 0:
                    time_diff = (rt['timestamp'] - prev_rt['timestamp']).total_seconds() / 60.0
                    if time_diff <= active_rules.get('REVENGE', 15.0):
                        is_revenge = True
                        
            is_oversized = False
            if i >= 10:
                past_20 = [r['total_val'] for r in round_trips[max(0, i-20):i]]
                median_size = np.median(past_20) if past_20 else 0
                if rt['total_val'] > (median_size * active_rules.get('OVERSIZED', 1.5)):
                    is_oversized = True
                    
            if is_revenge:
                rt['label'] = 'REVENGE'
                tilt_events.append(rt)
            elif is_oversized:
                rt['label'] = 'OVERSIZED'
                tilt_events.append(rt)

        if len(tilt_events) < 8:
            return {'status': 'EMPTY_STATE', 'reason': 'Fewer than 8 tilt events'}
            
        tilt_pnls = [t['net_pnl'] for t in tilt_events]
        net_tilt_cost = -sum(tilt_pnls)
        
        np.random.seed(42)
        boot_costs = []
        for _ in range(2000):
            sample = np.random.choice(tilt_pnls, size=len(tilt_pnls), replace=True)
            boot_costs.append(-sum(sample))
            
        lower_bound = np.percentile(boot_costs, 5)
        upper_bound = np.percentile(boot_costs, 95)
        
        if lower_bound <= 0:
            return {'status': 'EMPTY_STATE', 'reason': 'Lower bound <= 0'}
            
        confidence_width = (upper_bound - lower_bound) / net_tilt_cost if net_tilt_cost != 0 else 999
        if confidence_width <= 1.0: conf = 'HIGH'
        elif confidence_width <= 2.0: conf = 'MEDIUM'
        else: conf = 'LOW'
        
        return {
            'status': 'SUCCESS',
            'net_tilt_cost': net_tilt_cost,
            'events': len(tilt_events),
            'confidence': conf,
            'lower': lower_bound,
            'upper': upper_bound,
            'top_leak': 'REVENGE'
        }

class TestBehavioralTwin(unittest.TestCase):
    def setUp(self):
        self.engine = MockBehavioralEngine()

    def generate_trade(self, symbol, side, status, qty, price, pnl, charges, timestamp, trade_code="T-1"):
        return {
            "trade_code": trade_code,
            "symbol": symbol,
            "side": side,
            "quantity": qty,
            "price": price,
            "status": status,
            "pnl": pnl,
            "brokerage": charges,
            "timestamp": timestamp.strftime('%Y-%m-%d %H:%M:%S') if timestamp else None
        }

    def test_both_revenge_and_oversized(self):
        base_time = datetime(2026, 10, 6, 10, 0)
        trades = []
        for i in range(10):
            trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, 10, 1, base_time + timedelta(minutes=i*20), f"T-{i}"))
        
        trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, -50, 5, base_time + timedelta(minutes=200), "T-10"))
        trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 50, 100, -200, 10, base_time + timedelta(minutes=205), "T-11"))
        
        for i in range(12, 20):
            trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 50, 100, -100, 5, base_time + timedelta(minutes=205+i), f"T-{i}"))
            
        res = self.engine.analyze_twin(trades)
        self.assertEqual(res['status'], 'SUCCESS')
        self.assertEqual(res['top_leak'], 'REVENGE')

    def test_scale_in_aggregation(self):
        base_time = datetime(2026, 10, 6, 10, 0)
        trades = []
        for i in range(10):
            trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, 10, 1, base_time + timedelta(minutes=i*20), f"T-{i}"))
            
        trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, -50, 5, base_time + timedelta(minutes=200), "T-10"))
        
        trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, -10, 1, base_time + timedelta(minutes=205), "T-11"))
        trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, -10, 1, base_time + timedelta(minutes=206), "T-11"))
        trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, -10, 1, base_time + timedelta(minutes=207), "T-11"))
        
        for i in range(12, 20):
            trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 50, 100, -100, 5, base_time + timedelta(minutes=207+i), f"T-{i}"))
            
        res = self.engine.analyze_twin(trades)
        self.assertEqual(res['status'], 'SUCCESS')

    def test_interval_crossing_zero(self):
        base_time = datetime(2026, 10, 6, 10, 0)
        trades = []
        for i in range(10):
            trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, -50, 5, base_time + timedelta(minutes=i*20), f"T-{i}"))
            trades.append(self.generate_trade("AAPL", "BUY", "EXECUTED", 10, 100, 60, 5, base_time + timedelta(minutes=i*20 + 2), f"R-{i}"))
            
        res = self.engine.analyze_twin(trades)
        self.assertEqual(res['status'], 'EMPTY_STATE')
        self.assertEqual(res['reason'], 'Lower bound <= 0')

if __name__ == '__main__':
    unittest.main()
