import os

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\src\\components', 'BehavioralTwin.jsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<ResponsiveContainer width="100%" height="100%">', '<div className="w-full h-[300px]"><ResponsiveContainer width="100%" height="100%">')
content = content.replace('</ResponsiveContainer>', '</ResponsiveContainer></div>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("JSX Fixed height.")
