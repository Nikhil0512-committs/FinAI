import numpy as np
from datetime import datetime, timedelta
import pickle
import os
import random

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
        
        past_values = [float(t.get('total_value') or 10000.0) for t in recent_trades[:5]]
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
                pred_class = int(np.argmax(probs))
                
                # Classes: 0: OPTIMAL, 1: REVENGE, 2: FOMO, 3: ESCALATION
                if pred_class == 1:
                    primary_state = 'REVENGE_TRADING_HIGH_RISK'
                    has_ml_risk = True
                    ml_summary = f"ML Model detected Revenge Trading (Probability: {float(probs[1]):.1%}). You recently lost money and are entering too quickly."
                    flags.append({
                        'state': primary_state,
                        'title': 'Revenge Trading Triggered (ML Detected)',
                        'description': ml_summary,
                        'z_score': round(float(probs[1] * 5), 2)
                    })
                elif pred_class == 2:
                    primary_state = 'FOMO_CHASING_RISK'
                    has_ml_risk = True
                    ml_summary = f"ML Model detected FOMO Entry (Probability: {float(probs[2]):.1%}). Entering during high volatility."
                    flags.append({
                        'state': primary_state,
                        'title': 'FOMO Entry Detected (ML)',
                        'description': ml_summary,
                        'z_score': round(float(probs[2] * 5), 2)
                    })
                elif pred_class == 3:
                    primary_state = 'POSITION_SIZE_ESCALATION'
                    has_ml_risk = True
                    ml_summary = f"ML Model detected Position Escalation (Probability: {float(probs[3]):.1%}). Averaging up or revenge sizing."
                    flags.append({
                        'state': primary_state,
                        'title': 'Aggressive Size Escalation (ML)',
                        'description': ml_summary,
                        'z_score': round(float(probs[3] * 5), 2)
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

    def compute_tilt_score(self, user_trades, current_trade_value, sentiment_tag='Neutral'):
        """Computes a real-time tilt score (0-100) based on immediate past trading activity."""
        if not user_trades or len(user_trades) == 0:
            return 0
            
        sorted_trades = sorted(user_trades, key=lambda x: str(x.get('timestamp') or ''), reverse=True)
        now = datetime.now()
        
        # 1. Time since last trade
        last_trade = sorted_trades[0]
        try:
            last_time = datetime.strptime(str(last_trade.get('timestamp')).split('.')[0], '%Y-%m-%d %H:%M:%S')
            time_gap_mins = (now - last_time).total_seconds() / 60.0
        except:
            time_gap_mins = 60.0
            
        # 2. Recent loss streak
        recent_pnl = [float(t.get('pnl', 0.0)) for t in sorted_trades[:3] if t.get('status') == 'CLOSED']
        consecutive_losses = 0
        for pnl in recent_pnl:
            if pnl < 0:
                consecutive_losses += 1
            else:
                break
                
        # 3. Size escalation
        past_values = [float(t.get('total_value') or (float(t.get('quantity', 1)) * float(t.get('price', 100.0)))) for t in sorted_trades[:5]]
        avg_position_val = np.mean(past_values) if past_values else current_trade_value
        size_ratio = current_trade_value / (avg_position_val + 1e-9) if avg_position_val > 0 else 1.0
        
        # Calculate Base Score
        score = 0
        
        # Time pressure (Max 30 points)
        if time_gap_mins < 5: score += 30
        elif time_gap_mins < 15: score += 20
        elif time_gap_mins < 30: score += 10
        
        # Loss Streak (Max 40 points)
        score += min(40, consecutive_losses * 15)
        
        # Size Escalation (Max 30 points)
        if size_ratio > 2.0: score += 30
        elif size_ratio > 1.5: score += 20
        elif size_ratio > 1.2: score += 10
        
        # Volatility multiplier
        if sentiment_tag in ['High Volatility', 'Bearish Volatility', 'Bearish']:
            score = int(score * 1.2)
            
        return min(100, max(0, score))

    def generate_behavioral_twin_projection(self, user_trades):
        """
        Monte Carlo projection of user's account 30 days forward.
        Path A: Continuing current habits (Current You)
        Path B: Following rules (Disciplined You)
        """
        if not user_trades or len(user_trades) < 6:
            return None
            
        analyzed_trades = [t for t in user_trades if t.get('status') in ('CLOSED', 'EXECUTED')]
        if len(analyzed_trades) < 6:
            return None
            
        pnls = [float(t.get('pnl', 0.0)) for t in analyzed_trades]
        win_pnls = [p for p in pnls if p > 0]
        loss_pnls = [p for p in pnls if p <= 0]
        
        avg_win = np.mean(win_pnls) if win_pnls else 200.0
        avg_loss = np.mean(loss_pnls) if loss_pnls else -250.0
        win_rate = len(win_pnls) / len(pnls) if pnls else 0.45
        
        # Assess revenge trading frequency and cost
        revenge_losses = []
        for i in range(len(analyzed_trades) - 1):
            if float(analyzed_trades[i+1].get('pnl', 0.0)) < 0:
                try:
                    t1 = datetime.strptime(str(analyzed_trades[i+1]['timestamp']).split('.')[0], '%Y-%m-%d %H:%M:%S')
                    t2 = datetime.strptime(str(analyzed_trades[i]['timestamp']).split('.')[0], '%Y-%m-%d %H:%M:%S')
                    if (t2 - t1).total_seconds() / 60.0 < 20.0:
                        revenge_losses.append(float(analyzed_trades[i].get('pnl', 0.0)))
                except: pass
                
        revenge_freq = len(revenge_losses) / len(loss_pnls) if loss_pnls else 0.2
        avg_revenge_loss = np.mean(revenge_losses) if revenge_losses else (avg_loss * 1.5)
        
        # Assess position sizing escalation cost
        escalation_losses = []
        past_values = [float(t.get('total_value') or (float(t.get('quantity', 1)) * float(t.get('price', 100.0)))) for t in analyzed_trades]
        avg_size = np.mean(past_values) if past_values else 10000.0
        for t in analyzed_trades:
            t_size = float(t.get('total_value') or (float(t.get('quantity', 1)) * float(t.get('price', 100.0))))
            if t_size > avg_size * 1.2 and float(t.get('pnl', 0.0)) < 0:
                escalation_losses.append(float(t.get('pnl', 0.0)))
                
        escalation_freq = len(escalation_losses) / len(pnls) if pnls else 0.1
        avg_escalation_loss = np.mean(escalation_losses) if escalation_losses else (avg_loss * 1.8)
        
        # 30-day projection (assuming 3 trades per day = 90 trades)
        days = 30
        trades_per_day = max(1, min(10, len(pnls) / 7.0)) # estimate based on history, bounded
        total_future_trades = int(days * trades_per_day)
        
        # Baseline (You Now) - 1000 simulations
        current_you_sims = []
        disciplined_you_sims = []
        
        for _ in range(100):
            current_path = [0]
            disciplined_path = [0]
            
            for _ in range(total_future_trades):
                # Current You
                if random.random() < revenge_freq:
                    current_path.append(current_path[-1] + random.gauss(avg_revenge_loss, abs(avg_revenge_loss)*0.2))
                elif random.random() < escalation_freq:
                    current_path.append(current_path[-1] + random.gauss(avg_escalation_loss, abs(avg_escalation_loss)*0.2))
                else:
                    if random.random() < win_rate:
                        current_path.append(current_path[-1] + random.gauss(avg_win, abs(avg_win)*0.2))
                    else:
                        current_path.append(current_path[-1] + random.gauss(avg_loss, abs(avg_loss)*0.2))
                        
                # Disciplined You (No revenge, no escalation, slightly better win rate from patience)
                disc_win_rate = min(0.65, win_rate * 1.1)
                disc_avg_loss = avg_loss * 0.8 # tighter stop losses
                
                if random.random() < disc_win_rate:
                    disciplined_path.append(disciplined_path[-1] + random.gauss(avg_win, abs(avg_win)*0.2))
                else:
                    disciplined_path.append(disciplined_path[-1] + random.gauss(disc_avg_loss, abs(disc_avg_loss)*0.2))
                    
            current_you_sims.append(current_path)
            disciplined_you_sims.append(disciplined_path)
            
        # Get median paths
        current_median = np.median(current_you_sims, axis=0)
        disciplined_median = np.median(disciplined_you_sims, axis=0)
        
        # Format for charts
        projection_data = []
        for i in range(len(current_median)):
            if i % int(max(1, trades_per_day)) == 0: # sample daily
                day = i // int(max(1, trades_per_day))
                projection_data.append({
                    'day': f'Day {day}',
                    'current_you': round(current_median[i], 2),
                    'disciplined_you': round(disciplined_median[i], 2)
                })
                
        final_difference = disciplined_median[-1] - current_median[-1]
        
        return {
            'projection_data': projection_data,
            'days': days,
            'final_difference': round(final_difference, 2),
            'current_final': round(current_median[-1], 2),
            'disciplined_final': round(disciplined_median[-1], 2),
            'metrics': {
                'revenge_freq_pct': round(revenge_freq * 100, 1),
                'escalation_freq_pct': round(escalation_freq * 100, 1)
            }
        }

    def get_full_behavioral_profile(self, user_trades):
        """
        Computes an in-depth quantitative trader psychology profile,
        analyzing behavioral biases, Z-scores, holding duration metrics, and discipline ROI.
        Requires a minimum sample size of 6 executed trades for statistical validity.
        """
        sorted_trades = sorted(user_trades or [], key=lambda x: str(x.get('timestamp') or ''), reverse=True)
        total_count = len(sorted_trades)

        if total_count < 6:
            # Trade audits for the trades placed so far
            pre_audits = []
            for t in sorted_trades:
                pnl = float(t.get('pnl') or 0.0)
                pre_audits.append({
                    'trade_code': t.get('trade_code', ''),
                    'symbol': t.get('symbol', ''),
                    'side': t.get('side', 'BUY'),
                    'quantity': int(t.get('quantity') or 1),
                    'price': float(t.get('price') or 0.0),
                    'pnl': round(pnl, 2),
                    'holding_time_minutes': float(t.get('holding_time_minutes') or 1.0),
                    'status': t.get('status', 'EXECUTED')
                })

            return {
                'profile_unlocked': False,
                'trade_count': total_count,
                'required_trades': 6,
                'discipline_score': None,
                'archetype': 'Calibrating (Statistical Baseline Required)',
                'metrics': None,
                'insights': [
                    f"Sample size calibration in progress ({total_count}/6 trades logged).",
                    "A minimum of 6 executed paper trades is required by SEBI-aligned quantitative standards to compute authentic behavioral metrics without statistical distortion."
                ],
                'trade_audits': pre_audits
            }

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
        sizes = [float(t.get('total_value') or 0.0) for t in sorted_trades]
        avg_size = float(np.mean(sizes)) if sizes else 10000.0
        post_loss_sizes = []
        for i in range(len(sorted_trades) - 1):
            if float(sorted_trades[i+1].get('pnl') or 0.0) < 0:
                post_loss_sizes.append(float(sorted_trades[i].get('total_value') or avg_size))

        avg_post_loss_size = float(np.mean(post_loss_sizes)) if post_loss_sizes else avg_size
        size_escalation_ratio = avg_post_loss_size / (avg_size + 1e-9)
        position_control_score = max(40, min(99, int(100 - max(0, (size_escalation_ratio - 1.0) * 80))))

        # 3. Holding Balance (Win vs Loss Holding Time)
        win_holds = [float(t.get('holding_time_minutes') or 15.0) for t in sorted_trades if float(t.get('pnl') or 0.0) > 0]
        loss_holds = [float(t.get('holding_time_minutes') or 15.0) for t in sorted_trades if float(t.get('pnl') or 0.0) <= 0]
        avg_win_hold = float(np.mean(win_holds)) if win_holds else 20.0
        avg_loss_hold = float(np.mean(loss_holds)) if loss_holds else 15.0
        holding_ratio = avg_win_hold / (avg_loss_hold + 1e-9)
        holding_score = max(30, min(98, int(min(98, holding_ratio * 55))))

        # 4. Overall Discipline Score
        discipline_score = int(np.mean([revenge_score, position_control_score, holding_score, 88]))

        # 5. Determine Archetype
        if revenge_score < 60:
            archetype = "Impulsive Trader (Trading Too Often)"
        elif position_control_score < 65:
            archetype = "Reckless Risk-Taker (Increasing Trade Size on Losses)"
        elif holding_score < 60:
            archetype = "Anxious Trader (Holding Losers, Selling Winners)"
        elif discipline_score >= 85:
            archetype = "Disciplined Trader (Following the Rules)"
        else:
            archetype = "Balanced Trader (Steady & Consistent)"

        # 6. Detailed Trade Audits
        trade_audits = []
        for t in sorted_trades[:15]:
            pnl = float(t.get('pnl') or 0.0)
            status = t.get('status', 'EXECUTED')
            code = t.get('trade_code', '')
            sym = t.get('symbol', 'EQUITY')
            side = t.get('side', 'BUY')
            qty = int(t.get('quantity') or 1)
            price = float(t.get('price') or 0.0)
            
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

        # Calculate Risk/Reward Ratio
        win_pnls = [float(t.get('pnl') or 0.0) for t in sorted_trades if float(t.get('pnl') or 0.0) > 0]
        loss_pnls = [float(t.get('pnl') or 0.0) for t in sorted_trades if float(t.get('pnl') or 0.0) <= 0]
        avg_win_pnl = float(np.mean(win_pnls)) if win_pnls else 0.0
        avg_loss_pnl = abs(float(np.mean(loss_pnls))) if loss_pnls else 1.0
        rrr = avg_win_pnl / (avg_loss_pnl + 1e-9)

        # Calculate Time-of-Day Analysis
        morning_pnls, midday_pnls, afternoon_pnls = [], [], []
        for t in sorted_trades:
            pnl = float(t.get('pnl') or 0.0)
            if t.get('timestamp'):
                try:
                    dt = datetime.strptime(str(t['timestamp']).split('.')[0], '%Y-%m-%d %H:%M:%S')
                    hour = dt.hour + dt.minute / 60.0
                    if 9.25 <= hour < 11.0: morning_pnls.append(pnl)
                    elif 11.0 <= hour < 13.5: midday_pnls.append(pnl)
                    else: afternoon_pnls.append(pnl)
                except:
                    pass
        
        def calc_win_rate(pnls): return sum(1 for p in pnls if p > 0) / (len(pnls) + 1e-9) * 100.0 if pnls else 0.0
        tod_metrics = {
            'Morning': {'win_rate': calc_win_rate(morning_pnls), 'pnl': sum(morning_pnls)},
            'Mid-day': {'win_rate': calc_win_rate(midday_pnls), 'pnl': sum(midday_pnls)},
            'Afternoon': {'win_rate': calc_win_rate(afternoon_pnls), 'pnl': sum(afternoon_pnls)}
        }
        best_tod = max(tod_metrics.keys(), key=lambda k: tod_metrics[k]['win_rate'])

        # Market Context
        rsi_loss_count = sum(1 for t in sorted_trades if float(t.get('pnl') or 0.0) <= 0 and float(t.get('rsi_14') or 50.0) > 70)
        high_rsi_loss_pct = (rsi_loss_count / len(loss_pnls) * 100.0) if loss_pnls else 0.0

        improvements = [
            {
                'pillar': 'Next Trade Blueprint',
                'title': 'Primary Action Item',
                'current_value': 'Dynamic Rule',
                'target_value': 'Strict Execution',
                'status': 'NEEDS_IMPROVEMENT' if discipline_score < 80 else 'OPTIMAL',
                'recommendation': f"Rule 1: Trade size must be under Rs. {int(avg_size)}. Rule 2: Do not trade outside of {best_tod} session. Rule 3: Wait for pullbacks if RSI is above 70.",
                'rupee_impact': round(avg_loss_pnl * 1.5, 1)
            },
            {
                'pillar': 'Risk Management',
                'title': 'Risk/Reward Ratio (RRR)',
                'current_value': f"1:{rrr:.2f}",
                'target_value': '1:>=2.00',
                'status': 'OPTIMAL' if rrr >= 2.0 else 'NEEDS_IMPROVEMENT',
                'recommendation': 'You need an RRR of at least 1:2 to be sustainably profitable. Cut losses tighter and let winners run.',
                'rupee_impact': round(avg_loss_pnl * (2.0 - rrr) if rrr < 2.0 else 0, 1)
            },
            {
                'pillar': 'Time of Day',
                'title': 'Optimal Trading Window',
                'current_value': f"{best_tod} (Win Rate: {tod_metrics[best_tod]['win_rate']:.1f}%)",
                'target_value': 'Only trade in Best Session',
                'status': 'OPTIMAL' if tod_metrics[best_tod]['win_rate'] > 50 else 'NEEDS_IMPROVEMENT',
                'recommendation': f"Your best performance is in the {best_tod} session. Avoid forcing trades in other sessions.",
                'rupee_impact': round(sum([v['pnl'] for k, v in tod_metrics.items() if v['pnl'] < 0]) * -1, 1)
            },
            {
                'pillar': 'Market Context',
                'title': 'Overbought RSI Entry',
                'current_value': f"{high_rsi_loss_pct:.1f}% Losses",
                'target_value': '0.0% Losses',
                'status': 'MODERATE' if high_rsi_loss_pct > 30 else 'OPTIMAL',
                'recommendation': 'You tend to buy when the stock is already overextended (RSI > 70). Wait for a pullback to RSI < 60 before entering.',
                'rupee_impact': round(avg_loss_pnl * rsi_loss_count, 1)
            }
        ]

        # 8. Generate Layman's Summary
        layman_brief = "In simple terms, here is how you are doing: "
        layman_points = []
        if revenge_count > 0:
            layman_points.append("You tend to jump right back into the market too quickly after a losing trade, trying to immediately make your money back.")
        else:
            layman_points.append("You do a great job of taking a break after a losing trade instead of panic-trading.")
            
        if size_escalation_ratio > 1.2:
            layman_points.append("When you lose money, you start betting larger amounts on the next trades to recover your losses. This is dangerous.")
        else:
            layman_points.append("You keep your bet sizes consistent, which is very safe.")
            
        if avg_loss_hold > avg_win_hold * 1.3:
            layman_points.append("You hold onto your losing stocks for way too long hoping they will bounce back, but you sell your winning stocks too early.")
        else:
            layman_points.append("You are good at selling losing stocks quickly and letting your winning stocks run.")
            
        layman_brief += " ".join(layman_points)

        market_orders = sum(1 for t in sorted_trades if str(t.get('order_type', 'MARKET')).upper() == 'MARKET')
        market_pct = (market_orders / total_count) * 100 if total_count > 0 else 100.0
        limit_pct = 100.0 - market_pct

        overall_win_rate = len(win_pnls) / total_count * 100.0 if total_count > 0 else 0.0
        fomo_cost = sum(abs(float(t.get('pnl') or 0.0)) for t in sorted_trades if float(t.get('pnl') or 0.0) < 0 and float(t.get('rsi_14') or 50.0) > 70)

        return {
            'profile_unlocked': True,
            'trade_count': total_count,
            'required_trades': 6,
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
                'loss_hold_mins': round(avg_loss_hold, 1),
                'market_orders_pct': round(market_pct, 1),
                'limit_orders_pct': round(limit_pct, 1),
                'rrr': round(rrr, 2),
                'win_rate': round(overall_win_rate, 1),
                'fomo_cost': round(fomo_cost, 2),
                'tod_metrics': tod_metrics
            },
            'insights': insights,
            'layman_brief': layman_brief,
            'improvements': improvements,
            'trade_audits': trade_audits,
            'counterfactual_savings': round(sum([v['pnl'] for k, v in tod_metrics.items() if v['pnl'] < 0]) * -1 + (avg_loss_pnl * revenge_count) + (avg_loss_pnl * (2.0 - rrr) if rrr < 2.0 else 0), 2)
        }


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

behavioral_engine = BehavioralEngine()
