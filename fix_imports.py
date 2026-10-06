import re

files = [
    'src/components/BehavioralScorecard.jsx',
    'src/components/MarketIntelligence.jsx',
    'src/components/OrderBook.jsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the bad API_BASE insertion
    content = content.replace('\nconst API_BASE = import.meta.env.VITE_API_URL || "";\n', '\n')
    content = content.replace('const API_BASE = import.meta.env.VITE_API_URL || "";', '')
    
    # Insert it correctly after all imports end
    # Find the last import statement
    matches = list(re.finditer(r"^import\s+.*?;?\s*$", content, flags=re.MULTILINE))
    if matches:
        last_import = matches[-1]
        insert_pos = last_import.end()
        content = content[:insert_pos] + '\n\nconst API_BASE = import.meta.env.VITE_API_URL || "";\n' + content[insert_pos:]
    else:
        # Fallback to the top
        content = 'const API_BASE = import.meta.env.VITE_API_URL || "";\n' + content
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Fixed API_BASE injections!")
