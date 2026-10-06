import re
with open('src/pages/DashboardPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-900/50">MARKET: OPEN</span>', 
    '{marketStatus?.is_open ? <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 border border-emerald-900/50">MARKET: OPEN</span> : <span className="text-amber-400 bg-amber-950/30 px-2 py-0.5 border border-amber-900/50">MARKET: CLOSED</span>}'
)

with open('src/pages/DashboardPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Dashboard updated!")
