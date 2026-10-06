import os

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\src\\components', 'BehavioralTwin.jsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix redundant paddings
content = content.replace('p-4 sm:p-6 md:p-4 sm:p-6 md:p-8', 'p-4 md:p-8')

# Optimize text sizes in Legacy UI
content = content.replace('text-2xl font-light font-mono', 'text-xl md:text-2xl font-light font-mono')
content = content.replace('text-3xl font-light font-mono', 'text-2xl md:text-3xl font-light font-mono')

# Make the CTA button full width on mobile
content = content.replace('className="whitespace-nowrap px-6 py-2 bg-white', 'className="w-full md:w-auto whitespace-nowrap px-6 py-2 bg-white text-center justify-center')
content = content.replace('className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest border border-emerald-900/50 bg-emerald-950/30 px-4 py-2"', 'className="flex items-center justify-center w-full md:w-auto gap-2 text-emerald-400 text-xs font-mono uppercase tracking-widest border border-emerald-900/50 bg-emerald-950/30 px-4 py-2"')

# Height for empty state
content = content.replace('h-[400px]', 'min-h-[300px] md:min-h-[400px]')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Mobile cleanup complete.")
