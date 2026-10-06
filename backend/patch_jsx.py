import os

NEW_METHOD = '''
  const handleTakeRule = async () => {
    try {
      const activeUser = userId || 'usr_guest';
      const res = await fetch(`${API_BASE}/api/behavioral-twin/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: activeUser, rule_type: simplifiedData.top_leak, threshold: parseFloat(ruleThreshold) })
      });
      if (res.ok) setRuleAccepted(true);
    } catch (e) { console.error(e); }
  };

  const fetchProjection ='''

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\src\\components', 'BehavioralTwin.jsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('onClick={() => setRuleAccepted(true)}', 'onClick={handleTakeRule}')
content = content.replace('const fetchProjection =', NEW_METHOD)
content = content.replace('setSimplifiedData(data.simplified);', '''setSimplifiedData(data.simplified);
          if (data.simplified?.rule_accepted) {
            setRuleAccepted(true);
            setRuleThreshold(data.simplified.accepted_threshold);
          }''')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("JSX Patched.")
