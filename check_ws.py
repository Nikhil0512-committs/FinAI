with open('backend/app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
start = -1
for i, l in enumerate(lines):
    if '@app.websocket("/ws/stream")' in l:
        start = i
        break
        
if start != -1:
    print("".join(lines[start:start+60]))
