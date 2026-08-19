import zipfile
import pandas as pd
import numpy as np
import xgboost as xgb
import pickle
import os
import random
import json
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.path.join(BASE_DIR, "archive (1).zip")
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'behavioral_ml_model.pkl')
METRICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'behavioral_ml_metrics.json')

# Behavior Classifications
OPTIMAL = 0
REVENGE = 1
FOMO = 2
ESCALATION = 3

def calculate_technical_features(df):
    """Calculates market-level technical features for FOMO/market context."""
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    
    df['ret_1'] = df['close'].pct_change()
    df['ret_5'] = df['close'].pct_change(5)
    df['volatility_20'] = df['ret_1'].rolling(window=20).std()
    
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / (loss + 1e-9)
    df['rsi_14'] = 100 - (100 / (1 + rs))
    
    # MACD
    ema_12 = df['close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema_12 - ema_26
    
    df.bfill(inplace=True) # Fill initial NaNs
    return df

def generate_synthetic_trades(df, symbol):
    """Simulates a user's trading history over the price dataset to create training examples."""
    trades = []
    
    # We will sample random points to act as "trades"
    indices = list(range(50, len(df), 30))  # every 30 mins
    if len(indices) > 5000:
        indices = random.sample(indices, 5000)
    indices.sort()
    
    last_trade_time = None
    last_pnl = 0
    avg_position_size = 10000.0
    
    for idx in indices:
        row = df.iloc[idx]
        current_time = row['date']
        
        time_gap_mins = (current_time - last_trade_time).total_seconds() / 60.0 if last_trade_time else 100.0
        
        # Decide behavior randomly to generate a balanced dataset
        behavior_type = random.choices(
            [OPTIMAL, REVENGE, FOMO, ESCALATION],
            weights=[0.4, 0.2, 0.2, 0.2]
        )[0]
        
        # Construct features based on the chosen behavior type so the model can learn it
        
        if behavior_type == REVENGE:
            # Short time gap after a loss
            time_gap = random.uniform(1, 15)
            last_pnl_val = random.uniform(-5000, -100)
            position_size = avg_position_size * random.uniform(0.8, 1.2)
        elif behavior_type == ESCALATION:
            # Large position size after a loss
            time_gap = random.uniform(30, 200)
            last_pnl_val = random.uniform(-5000, -100)
            position_size = avg_position_size * random.uniform(1.5, 3.0)
        elif behavior_type == FOMO:
            # Buying during high volatility or extreme RSI
            time_gap = random.uniform(60, 500)
            last_pnl_val = random.uniform(-1000, 5000)
            position_size = avg_position_size * random.uniform(0.8, 1.2)
            # Override market features to simulate FOMO environment
            row['volatility_20'] = random.uniform(0.015, 0.05)
            row['rsi_14'] = random.uniform(70, 95) 
            row['ret_5'] = random.uniform(0.01, 0.05)
        else: # OPTIMAL
            time_gap = random.uniform(30, 1000)
            last_pnl_val = random.uniform(-2000, 5000)
            position_size = avg_position_size * random.uniform(0.8, 1.2)
            row['volatility_20'] = random.uniform(0.001, 0.01)
            row['rsi_14'] = random.uniform(30, 60)
            
        trade = {
            'time_gap_mins': time_gap,
            'last_pnl': last_pnl_val,
            'position_size_ratio': position_size / (avg_position_size + 1e-9),
            'volatility_20': row['volatility_20'],
            'rsi_14': row['rsi_14'],
            'macd': row['macd'],
            'ret_5': row['ret_5'],
            'target_behavior': behavior_type
        }
        
        trades.append(trade)
        
        # Update state for next iteration
        last_trade_time = current_time + pd.Timedelta(minutes=time_gap)
        last_pnl = random.uniform(-1000, 1000) # simulate next result
        avg_position_size = avg_position_size * 0.9 + position_size * 0.1 # EWMA
        
    return pd.DataFrame(trades)

def train_model():
    print("Extracting data and generating synthetic behavioral trades...")
    
    df_list = []
    random.seed(42)
    np.random.seed(42)

    with zipfile.ZipFile(ZIP_PATH) as z:
        preferred = ['RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'SBIN', 'ICICIBANK', 'TATAMOTORS', 'ADANIENT', 'LT', 'AXISBANK']
        names = [name for name in z.namelist() if name.endswith('_minute.csv')]
        preferred_files = [f"{symbol}_minute.csv" for symbol in preferred if f"{symbol}_minute.csv" in names]
        remaining = [name for name in names if name not in preferred_files]
        sample_files = preferred_files + remaining[:20]
        
        for file in sample_files:
            try:
                print(f"Processing {file}...")
                with z.open(file) as f:
                    df_market = pd.read_csv(f, nrows=25000)
                    df_market = calculate_technical_features(df_market)
                    df_trades = generate_synthetic_trades(df_market, file.replace('_minute.csv', ''))
                    df_list.append(df_trades)
            except KeyError:
                print(f"Warning: {file} not found in zip.")
                
    if not df_list:
        print("No data extracted. Training aborted.")
        return
        
    final_df = pd.concat(df_list, ignore_index=True)
    
    # Clean inf values that XGBoost doesn't like
    final_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    features = ['time_gap_mins', 'last_pnl', 'position_size_ratio', 'volatility_20', 'rsi_14', 'macd', 'ret_5']
    X = final_df[features].values
    y = final_df['target_behavior'].values
    
    print(f"Training data shape: {X.shape}.")
    print("Class distribution:")
    print(final_df['target_behavior'].value_counts(normalize=True))
    
    # We use XGBClassifier for Multi-class classification
    model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=4,
        n_estimators=80,
        max_depth=5,
        learning_rate=0.05,
        random_state=42
    )
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Behavioral XGBoost model...")
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    metrics = {
        'training_rows': int(len(final_df)),
        'features': features,
        'accuracy': round(float(accuracy_score(y_test, y_pred)), 4),
        'class_report': classification_report(
            y_test,
            y_pred,
            target_names=['OPTIMAL', 'REVENGE', 'FOMO', 'ESCALATION'],
            output_dict=True,
            zero_division=0
        )
    }
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)

    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Model successfully saved to {MODEL_PATH}")
    print(f"Metrics saved to {METRICS_PATH}: accuracy={metrics['accuracy']}")

if __name__ == "__main__":
    train_model()
