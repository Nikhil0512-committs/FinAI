import os

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\src\\components', 'BehavioralTwin.jsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make padding responsive
content = content.replace('className="p-8 ', 'className="p-4 sm:p-6 md:p-8 ')
content = content.replace('p-8 border-b', 'p-4 sm:p-6 md:p-8 border-b')
content = content.replace('p-8 text-center', 'p-4 sm:p-6 md:p-8 text-center')
content = content.replace('className="flex-1 p-6 relative', 'className="flex-1 p-4 sm:p-6 relative')

# Make flex wrapping responsive
content = content.replace('className="flex items-center gap-4 mb-4"', 'className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4"')
content = content.replace('className="flex gap-6 text-[9px]', 'className="flex flex-wrap gap-3 sm:gap-6 text-[9px]')

# Fix the chart legend header collision on mobile
content = content.replace('className="flex justify-between items-center mb-6 z-10"', 'className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 z-10"')

# Make sure the "Take This Rule" button area wraps nicely
content = content.replace('className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4', 'className="mt-6 flex flex-col md:flex-row items-start md:items-center gap-4')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("JSX Mobile styling patched.")
