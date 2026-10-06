import os

file_path = os.path.join('c:\\Users\\nikhi.NIKHIL\\Downloads\\FinAI-main 4\\FinAI-main\\src\\components', 'BehavioralTwin.jsx')
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract blocks
empty_state_idx = content.find('// --- EMPTY STATE ---')
legacy_view_idx = content.find('// --- LEGACY PROJECTION VIEW ---')
simplified_view_idx = content.find('// --- SIMPLIFIED INTRADAY VIEW ---')

prefix = content[:empty_state_idx]
empty_block = content[empty_state_idx:legacy_view_idx]
legacy_block = content[legacy_view_idx:simplified_view_idx]
suffix = content[simplified_view_idx:]

new_content = prefix + legacy_block + empty_block + suffix

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("JSX Fixed.")
