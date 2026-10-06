with open('src/context/TradingContext.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
# We will just comment out fetchApiKeys() calls
for i in range(len(lines)):
    if 'fetchApiKeys();' in lines[i]:
        lines[i] = lines[i].replace('fetchApiKeys();', '// fetchApiKeys();')
        
with open('src/context/TradingContext.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
    
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
content = content.replace('} />\n                    <Route path="/platform"', '<Route path="/platform"')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
