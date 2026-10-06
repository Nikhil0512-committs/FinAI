import os
import sys

NEW_METHODS = '''
    def get_accepted_rules(self, user_id):
        try:
            with psycopg2.connect(self.db_url, sslmode='require') as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("SELECT rule_type, threshold FROM accepted_rules WHERE user_id = %s AND active = TRUE", (user_id,))
                    rows = cur.fetchall()
                    return {row['rule_type']: float(row['threshold']) for row in rows}
        except Exception as e:
            print(f"Error fetching rules: {e}")
            return {}

    def save_accepted_rule(self, user_id, rule_type, threshold):
        try:
            with psycopg2.connect(self.db_url, sslmode='require') as conn:
                with conn.cursor() as cur:
                    cur.execute("UPDATE accepted_rules SET active = FALSE WHERE user_id = %s AND rule_type = %s", (user_id, rule_type))
                    cur.execute("INSERT INTO accepted_rules (user_id, rule_type, threshold) VALUES (%s, %s, %s)", (user_id, rule_type, threshold))
                conn.commit()
            return True
        except Exception as e:
            print(f"Error saving rule: {e}")
            return False
'''

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\backend', 'database.py')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'def get_accepted_rules' not in content:
    with open(file_path, 'a', encoding='utf-8') as f:
        f.write(NEW_METHODS)
    print("DB Patched with rule methods.")
else:
    print("DB Already patched.")
