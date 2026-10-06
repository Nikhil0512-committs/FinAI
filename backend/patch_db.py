import os

NEW_TABLES = """
        CREATE TABLE IF NOT EXISTS accepted_rules (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            rule_type TEXT,
            threshold NUMERIC,
            accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active BOOLEAN DEFAULT TRUE
        );

        CREATE TABLE IF NOT EXISTS rule_violations_log (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            rule_id INTEGER,
            session_date DATE
        );
        
        CREATE TABLE IF NOT EXISTS api_keys"""

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\backend', 'database.py')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'CREATE TABLE IF NOT EXISTS accepted_rules' not in content:
    content = content.replace('CREATE TABLE IF NOT EXISTS api_keys', NEW_TABLES)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Database Patched.")
else:
    print("Already patched.")
