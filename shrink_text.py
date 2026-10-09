import os, re

mapping = {
    'text-3xl': 'text-xl',
    'text-4xl': 'text-2xl',
    'text-5xl': 'text-3xl',
    'text-6xl': 'text-4xl',
    'text-7xl': 'text-5xl'
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r'text-(3xl|4xl|5xl|6xl|7xl)', lambda m: mapping.get(m.group(), m.group()), content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, _, files in os.walk('app'):
    for f in files:
        if f.endswith('.tsx'):
            replace_in_file(os.path.join(root, f))
