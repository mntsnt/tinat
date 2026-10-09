import os, re

text_mapping = {
    'text-3xl': 'text-xl',
    'text-4xl': 'text-2xl',
    'text-5xl': 'text-3xl',
    'text-6xl': 'text-4xl',
    'text-7xl': 'text-5xl'
}

pad_mapping = {
    'py-20': 'py-12',
    'py-24': 'py-16',
    'py-32': 'py-20',
    'gap-12': 'gap-8',
    'gap-16': 'gap-10',
    'p-6': 'p-5',
    'p-8': 'p-6'
}

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Shrink text
    new_content = re.sub(r'\btext-(3xl|4xl|5xl|6xl|7xl)\b', lambda m: text_mapping.get(m.group(), m.group()), content)
    
    # Shrink paddings and gaps
    new_content = re.sub(r'\b(py-(20|24|32)|gap-(12|16)|p-(6|8))\b', lambda m: pad_mapping.get(m.group(), m.group()), new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

for root, _, files in os.walk('app'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            replace_in_file(os.path.join(root, f))
