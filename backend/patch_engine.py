import os
import sys

NEW_METHOD = '''
    def analyze_simplified_twin(self, raw_trades, active_rules=None, starting_capital=100000.0):
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
                existing['quantity'] += float(t.get('quantity', 0))
                existing['pnl'] += float(t.get('pnl', 0))
                existing['brokerage'] += float(t.get('brokerage', 0))
                existing['total_val'] += (float(t.get('quantity', 0)) * float(t.get('price', 0)))
            else:
                round_trips.append({
                    'trade_code': t.get('trade_code', 'UNKNOWN'),
                    'timestamp': datetime.strptime(str(t['timestamp']).split('.')[0], '%Y-%m-%d %H:%M:%S'),
                    'pnl': float(t.get('pnl', 0)),
                    'brokerage': float(t.get('brokerage', 0)),
                    'quantity': float(t.get('quantity', 0)),
                    'total_val': float(t.get('quantity', 0)) * float(t.get('price', 0)),
                    'label': None,
                    'is_tilt': False
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
                if median_size > 0 and rt['total_val'] > (median_size * active_rules.get('OVERSIZED', 1.5)):
                    is_oversized = True
                    
            if is_revenge:
                rt['label'] = 'REVENGE'
                rt['is_tilt'] = True
                tilt_events.append(rt)
            elif is_oversized:
                rt['label'] = 'OVERSIZED'
                rt['is_tilt'] = True
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
            
        confidence_width = (upper_bound - lower_bound) / net_tilt_cost if net_tilt_cost > 0 else 999
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
            'top_leak': 'REVENGE',
            'round_trips': round_trips
        }
'''

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\backend', 'behavioral_engine.py')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Just append to the file (BehavioralEngine class spans the whole file practically)
if 'def analyze_simplified_twin' not in content:
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(NEW_METHOD)
    print("Patched.")
else:
    print("Already patched.")
