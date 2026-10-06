import re
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
    
# Remove the dangling '} />'
content = content.replace("} />\n                    <Route path=\"/platform\"", "<Route path=\"/platform\"")

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/context/TradingContext.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's see what's around line 183 in TradingContext.jsx to fix it manually or script it
