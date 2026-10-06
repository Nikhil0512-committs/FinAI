import os

NEW_ENDPOINT = '''
class RulePayload(BaseModel):
    user_id: str
    rule_type: str
    threshold: float

@app.post("/api/behavioral-twin/rules")
def save_behavioral_rule(payload: RulePayload):
    success = db.save_accepted_rule(payload.user_id, payload.rule_type, payload.threshold)
    return {"success": success}
'''

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\backend', 'app.py')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the GET endpoint to fetch rules
old_get = '''@app.get("/api/behavioral-twin")
def get_behavioral_twin(user_id: str = 'default_user'):
    trades = db.get_trade_history(user_id)
    simplified_data = behavioral_engine.analyze_simplified_twin(trades)'''

new_get = '''@app.get("/api/behavioral-twin")
def get_behavioral_twin(user_id: str = 'default_user'):
    trades = db.get_trade_history(user_id)
    active_rules = db.get_accepted_rules(user_id)
    simplified_data = behavioral_engine.analyze_simplified_twin(trades, active_rules=active_rules)
    if simplified_data and simplified_data.get('status') == 'SUCCESS':
        # Check if the top leak rule is already accepted
        top_leak = simplified_data.get('top_leak')
        simplified_data['rule_accepted'] = top_leak in active_rules
        if top_leak in active_rules:
            simplified_data['accepted_threshold'] = active_rules[top_leak]
'''

if 'def save_behavioral_rule' not in content:
    content = content.replace(old_get, new_get)
    content += NEW_ENDPOINT
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("App Patched.")
else:
    print("App Already patched.")
