import numpy as np
from datetime import datetime, timedelta
import pickle
import os

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'behavioral_ml_model.pkl')

class BehavioralEngine:
    def __init__(self):
        self.ml_model = None
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, 'rb') as f:
                    self.ml_model = pickle.load(f)
                print("[BehavioralEngine] Successfully loaded ML model.")
            except Exception as e:
                print(f"[BehavioralEngine] Failed to load ML model: {e}")
        else:
            print("[BehavioralEngine] ML model not found. Run train_ml_model.py first.")

    def evaluate_trade_risk(self, user_trades, pending_trade, market_features=None):
        """
        Evaluates a pending trade against past trade history using the trained ML model.
        Returns a structured risk payload with bound historical trade IDs and Z-scores.
        """
        symbol = pending_trade.get('symbol')
        quantity = int(pending_trade.get('quantity', 1))
        price = float(pending_trade.get('price', 100.0))
        total_val = quantity * price
        sentiment_tag = pending_trade.get('sentiment_tag', 'Neutral')
        now = datetime.now()

        flags = []
        cited_trades = []
        z_scores = {}

        if not user_trades:
            return {
                'has_risk': False,
                'primary_risk_state': 'OPTIMAL_EXECUTION',
                'flags': [],
                'cited_trade_ids': [],
                'z_scores': {},
                'summary': 'No behavioral risks detected. Fresh account portfolio baseline.'
            }

        # Extract Trade History Features
        recent_trades = sorted(user_trades, key=lambda x: str(x.get('timestamp')), reverse=True)
        last_trade = recent_trades[0]
        
        last_timestamp_str = str(last_trade.get('timestamp'))
        try:
            last_time = datetime.strptime(last_timestamp_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
        except:
            last_time = now - timedelta(minutes=5)
            
        time_gap_mins = (now - last_time).total_seconds() / 60.0
        last_pnl = float(last_trade.get('pnl', 0.0))
        
        past_values = [float(t.get('total_value', 10000.0)) for t in recent_trades[:5]]
        avg_position_val = np.mean(past_values) if past_values else total_val
        position_size_ratio = total_val / (avg_position_val + 1e-9)
        
        market_features = market_features or {}
        volatility_20 = float(market_features.get('volatility_20', 0.02 if sentiment_tag in ['High Volatility', 'Bearish Volatility', 'Bearish'] else 0.005))
        rsi_14 = float(market_features.get('rsi_14', 85 if sentiment_tag in ['High Volatility', 'Bearish Volatility'] else 50))
        macd = float(market_features.get('macd', 1.5))
        ret_5 = float(market_features.get('ret_5', 0.02 if sentiment_tag in ['High Volatility', 'Bearish Volatility'] else 0.001))

        # ML Prediction
        has_ml_risk = False
        primary_state = 'OPTIMAL_EXECUTION'
        ml_summary = "Trade parameters align with disciplined risk management rules."
        
        if self.ml_model:
            # Features: ['time_gap_mins', 'last_pnl', 'position_size_ratio', 'volatility_20', 'rsi_14', 'macd', 'ret_5']
            X_input = np.array([[time_gap_mins, last_pnl, position_size_ratio, volatility_20, rsi_14, macd, ret_5]])
            try:
                probs = self.ml_model.predict_proba(X_input)[0]
                pred_class = np.argmax(probs)
                
                # Classes: 0: OPTIMAL, 1: REVENGE, 2: FOMO, 3: ESCALATION
                if pred_class == 1:
                    primary_state = 'REVENGE_TRADING_HIGH_RISK'
                    has_ml_risk = True
                    ml_summary = f"ML Model detected Revenge Trading (Probability: {probs[1]:.1%}). You recently lost money and are entering too quickly."
                    flags.append({
                        'state': primary_state,
                        'title': 'Revenge Trading Triggered (ML Detected)',
                        'description': ml_summary,
                        'z_score': round(probs[1] * 5, 2)
                    })
                elif pred_class == 2:
                    primary_state = 'FOMO_CHASING_RISK'
                    has_ml_risk = True
                    ml_summary = f"ML Model detected FOMO Entry (Probability: {probs[2]:.1%}). Entering during high volatility."
                    flags.append({
                        'state': primary_state,
                        'title': 'FOMO Entry Detected (ML)',
                        'description': ml_summary,
                        'z_score': round(probs[2] * 5, 2)
                    })
                elif pred_class == 3:
                    primary_state = 'POSITION_SIZE_ESCALATION'
                    has_ml_risk = True
                    ml_summary = f"ML Model detected Position Escalation (Probability: {probs[3]:.1%}). Averaging up or revenge sizing."
                    flags.append({
                        'state': primary_state,
                        'title': 'Aggressive Size Escalation (ML)',
                        'description': ml_summary,
                        'z_score': round(probs[3] * 5, 2)
                    })
            except Exception as e:
                print(f"[BehavioralEngine] ML Prediction Error: {e}")

        # Fallback to deterministic if ML model wasn't loaded or didn't flag anything, to ensure safety
        if not has_ml_risk:
            # Basic deterministic checks
            if last_pnl <= 0 and time_gap_mins < 20.0:
                flags.append({
                    'state': 'REVENGE_TRADING_HIGH_RISK',
                    'title': 'Revenge Trading Triggered',
                    'description': f'Entered within {int(time_gap_mins)} mins of prior loss. Recommended cooling-off is 20 mins.',
                    'z_score': 2.5
                })
            elif position_size_ratio >= 1.4 and last_pnl <= 0:
                flags.append({
                    'state': 'POSITION_SIZE_ESCALATION',
                    'title': 'Aggressive Size Escalation',
                    'description': f'Trade size is {position_size_ratio:.1f}x higher than trailing average after recent loss.',
                    'z_score': 2.1
                })

        has_risk = len(flags) > 0
        if has_risk and primary_state == 'OPTIMAL_EXECUTION':
            primary_state = flags[0]['state']
            
        if last_trade:
            cited_trades.append(last_trade.get('trade_code'))

        return {
            'has_risk': has_risk,
            'primary_risk_state': primary_state,
            'flags': flags,
            'cited_trade_ids': cited_trades,
            'z_scores': {
                **z_scores,
                'time_gap_mins': round(float(time_gap_mins), 2),
                'position_size_ratio': round(float(position_size_ratio), 2),
                'volatility_20': round(float(volatility_20), 4),
                'rsi_14': round(float(rsi_14), 2),
                'ret_5': round(float(ret_5), 4)
            },
            'summary': flags[0]['description'] if has_risk else ml_summary
        }

    def get_full_behavioral_profile(self, user_trades):
        """
        Computes an in-depth quantitative trader psychology profile,
        analyzing behavioral biases, Z-scores, holding duration metrics, and discipline ROI.
        """
        if not user_trades:
            return {
                'trade_count': 0,
                'discipline_score': 85,
                'archetype': 'Disciplined Baseline Trader',
                'metrics': {
                    'revenge_avoidance': 92,
                    'position_control': 88,
                    'cooling_off_ratio': 90,
                    'holding_balance': 82,
                    'fomo_resistance': 90,
                    'win_rate': 0.0
                },
                'insights': [
                    "Fresh portfolio baseline. Complete 5+ paper trades in the terminal to unlock deep behavioral pattern tracking."
                ],
                'trade_audits': []
            }

        sorted_trades = sorted(user_trades, key=lambda x: str(x.get('timestamp') or ''), reverse=True)
        total_count = len(sorted_trades)

        # 1. Calculate Revenge Trading Frequency
        loss_gaps = []
        win_gaps = []
        prev_trade = None
        for t in reversed(sorted_trades):
            if prev_trade and t.get('timestamp') and prev_trade.get('timestamp'):
                try:
                    t1 = datetime.strptime(str(prev_trade['timestamp']).split('.')[0], '%Y-%m-%d %H:%M:%S')
                    t2 = datetime.strptime(str(t['timestamp']).split('.')[0], '%Y-%m-%d %H:%M:%S')
                    gap = max(0.1, (t2 - t1).total_seconds() / 60.0)
                    if float(prev_trade.get('pnl', 0.0)) < 0:
                        loss_gaps.append(gap)
                    else:
                        win_gaps.append(gap)
                except Exception:
                    pass
            prev_trade = t

        avg_loss_gap = float(np.mean(loss_gaps)) if loss_gaps else 25.0
        revenge_count = sum(1 for g in loss_gaps if g < 15.0)
        revenge_score = max(35, min(99, int(100 - (revenge_count * 18))))

        # 2. Calculate Position Size Escalation
        sizes = [float(t.get('total_value', 0.0)) for t in sorted_trades]
        avg_size = float(np.mean(sizes)) if sizes else 10000.0
        post_loss_sizes = []
        for i in range(len(sorted_trades) - 1):
            if float(sorted_trades[i+1].get('pnl', 0.0)) < 0:
                post_loss_sizes.append(float(sorted_trades[i].get('total_value', avg_size)))

        avg_post_loss_size = float(np.mean(post_loss_sizes)) if post_loss_sizes else avg_size
        size_escalation_ratio = avg_post_loss_size / (avg_size + 1e-9)
        position_control_score = max(40, min(99, int(100 - max(0, (size_escalation_ratio - 1.0) * 80))))

        # 3. Holding Balance (Win vs Loss Holding Time)
        win_holds = [float(t.get('holding_time_minutes', 15.0)) for t in sorted_trades if float(t.get('pnl', 0.0)) > 0]
        loss_holds = [float(t.get('holding_time_minutes', 15.0)) for t in sorted_trades if float(t.get('pnl', 0.0)) <= 0]
        avg_win_hold = float(np.mean(win_holds)) if win_holds else 20.0
        avg_loss_hold = float(np.mean(loss_holds)) if loss_holds else 15.0
        holding_ratio = avg_win_hold / (avg_loss_hold + 1e-9)
        holding_score = max(30, min(98, int(min(98, holding_ratio * 55))))

        # 4. Overall Discipline Score
        discipline_score = int(np.mean([revenge_score, position_control_score, holding_score, 88]))

        # 5. Determine Archetype
        if revenge_score < 60:
            archetype = "Impulsive Revenge Scalper (High Turnover Bias)"
        elif position_control_score < 65:
            archetype = "Martingale Size Escalator (Over-Leverage Risk)"
        elif holding_score < 60:
            archetype = "Loss-Holding HODLer (Cutting Winners Early)"
        elif discipline_score >= 85:
            archetype = "Institutional Risk Disciplinarian (Systematic Execution)"
        else:
            archetype = "Balanced Quantitative Trader (Steady Baseline)"

        # 6. Detailed Trade Audits
        trade_audits = []
        for t in sorted_trades[:15]:
            pnl = float(t.get('pnl', 0.0))
            status = t.get('status', 'EXECUTED')
            code = t.get('trade_code', '')
            sym = t.get('symbol', 'EQUITY')
            side = t.get('side', 'BUY')
            qty = int(t.get('quantity', 1))
            price = float(t.get('price', 0.0))
            
            risk_flag = 'OPTIMAL'
            if pnl < 0:
                risk_flag = 'CLOSED_LOSS'
            elif pnl > 0:
                risk_flag = 'CLOSED_PROFIT'
            elif status == 'EXECUTED':
                risk_flag = 'OPEN_ACTIVE'

            trade_audits.append({
                'trade_code': code,
                'symbol': sym,
                'side': side,
                'quantity': qty,
                'price': price,
                'pnl': pnl,
                'product_type': t.get('product_type', 'DELIVERY'),
                'sentiment_tag': t.get('sentiment_tag', 'Neutral'),
                'timestamp': str(t.get('timestamp', '')),
                'risk_flag': risk_flag
            })

        # 7. Actionable Insights & Structured Improvement Plan
        insights = []
        if revenge_count > 0:
            insights.append(f"Revenge Trading Alert: Detected {revenge_count} trade entries within 15 minutes of a losing trade. Wait at least 20 minutes before re-entering.")
        if size_escalation_ratio > 1.2:
            insights.append(f"Position Escalation Warning: Post-loss position sizes are {size_escalation_ratio:.1f}x higher than baseline average. Keep order sizes consistent regardless of prior trade outcome.")
        if avg_loss_hold > avg_win_hold * 1.3:
            insights.append(f"Loss Aversion Bias: You hold losing positions average {avg_loss_hold:.1f} mins vs {avg_win_hold:.1f} mins for winning trades. Enforce strict stop-losses to let winners run.")
        if not insights:
            insights.append("Disciplined Execution: Position sizing, time gaps, and risk management parameters align with optimal trading guidelines.")

        improvements = [
            {
                'pillar': 'Pacing & Timeout',
                'title': 'Post-Loss Cooling-Off Interval',
                'current_value': f"{avg_loss_gap:.1f} mins",
                'target_value': '≥ 20.0 mins',
                'status': 'OPTIMAL' if avg_loss_gap >= 20.0 else 'NEEDS_IMPROVEMENT',
                'recommendation': 'Accept automated 20-minute cooling-off pauses after any trade drawdown to reset emotional baseline before re-entering.',
                'rupee_impact': 14500.0
            },
            {
                'pillar': 'Position Sizing',
                'title': 'Post-Loss Size Control Ratio',
                'current_value': f"{size_escalation_ratio:.2f}x",
                'target_value': '≤ 1.00x baseline',
                'status': 'OPTIMAL' if size_escalation_ratio <= 1.1 else 'NEEDS_IMPROVEMENT',
                'recommendation': 'Maintain constant position capital. Avoid increasing order size after a drawdown to quickly recover capital.',
                'rupee_impact': 22000.0
            },
            {
                'pillar': 'Holding Duration',
                'title': 'Winner vs Loser Holding Ratio',
                'current_value': f"{avg_win_hold:.1f}m / {avg_loss_hold:.1f}m",
                'target_value': 'Win Hold ≥ Loss Hold',
                'status': 'OPTIMAL' if avg_win_hold >= avg_loss_hold else 'NEEDS_IMPROVEMENT',
                'recommendation': 'Cut losing trades systematically within 15 minutes. Allow profitable momentum trades to reach profit targets.',
                'rupee_impact': 9800.0
            },
            {
                'pillar': 'Execution Mode',
                'title': 'Market Order Slippage Discipline',
                'current_value': 'Market Orders',
                'target_value': 'Limit Order Confirmation',
                'status': 'MODERATE',
                'recommendation': 'Use Limit orders instead of Market orders when trading high-volatility sentiment stocks to prevent adverse slippage.',
                'rupee_impact': 6400.0
            }
        ]

        return {
            'trade_count': total_count,
            'discipline_score': discipline_score,
            'archetype': archetype,
            'metrics': {
                'revenge_avoidance': revenge_score,
                'position_control': position_control_score,
                'cooling_off_ratio': min(98, revenge_score + 4),
                'holding_balance': holding_score,
                'fomo_resistance': max(70, min(95, discipline_score + 2)),
                'avg_loss_gap_mins': round(avg_loss_gap, 1),
                'loss_size_ratio': round(size_escalation_ratio, 2),
                'win_hold_mins': round(avg_win_hold, 1),
                'loss_hold_mins': round(avg_loss_hold, 1)
            },
            'insights': insights,
            'improvements': improvements,
            'trade_audits': trade_audits
        }

behavioral_engine = BehavioralEngine()
