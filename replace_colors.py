import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Indigo to Primary
    content = re.sub(r'bg-indigo-600', 'bg-primary', content)
    content = re.sub(r'bg-indigo-500', 'bg-primary', content)
    content = re.sub(r'text-indigo-600', 'text-primary', content)
    content = re.sub(r'border-indigo-600', 'border-primary', content)
    content = re.sub(r'border-indigo-500', 'border-primary', content)
    content = re.sub(r'text-indigo-500', 'text-primary', content)
    content = re.sub(r'text-indigo-400', 'text-primary', content)
    content = re.sub(r'hover:text-indigo-600', 'hover:text-primary', content)
    content = re.sub(r'hover:text-indigo-500', 'hover:text-primary', content)
    content = re.sub(r'hover:bg-indigo-700', 'hover:bg-primary/90', content)
    content = re.sub(r'hover:bg-indigo-600', 'hover:bg-primary/90', content)
    content = re.sub(r'bg-indigo-50', 'bg-primary/5', content)
    content = re.sub(r'bg-indigo-100', 'bg-primary/10', content)
    content = re.sub(r'ring-indigo-600', 'ring-primary', content)
    content = re.sub(r'ring-indigo-500', 'ring-primary', content)
    content = re.sub(r'focus:ring-indigo-600', 'focus:ring-primary', content)
    
    # Blue to Primary
    content = re.sub(r'bg-blue-600', 'bg-primary', content)
    content = re.sub(r'bg-blue-500', 'bg-primary', content)
    content = re.sub(r'text-blue-600', 'text-primary', content)
    content = re.sub(r'text-blue-500', 'text-primary', content)
    content = re.sub(r'border-blue-600', 'border-primary', content)
    content = re.sub(r'border-blue-500', 'border-primary', content)
    content = re.sub(r'hover:bg-blue-700', 'hover:bg-primary/90', content)
    content = re.sub(r'hover:bg-blue-600', 'hover:bg-primary/90', content)
    content = re.sub(r'hover:text-blue-600', 'hover:text-primary', content)
    content = re.sub(r'bg-blue-50', 'bg-primary/5', content)
    content = re.sub(r'bg-blue-100', 'bg-primary/10', content)
    content = re.sub(r'ring-blue-600', 'ring-primary', content)
    content = re.sub(r'ring-blue-500', 'ring-primary', content)
    content = re.sub(r'focus:ring-blue-600', 'focus:ring-primary', content)
    content = re.sub(r'focus:border-blue-600', 'focus:border-primary', content)

    # Gradients - Replace them with plain backgrounds or subtle primary gradients to maintain minimal aesthetics
    content = re.sub(r'bg-gradient-to-r from-primary via-indigo-500 to-purple-600', 'bg-primary', content)
    content = re.sub(r'bg-gradient-to-r from-indigo-600 to-purple-600', 'bg-primary', content)
    content = re.sub(r'bg-gradient-to-r from-blue-600 to-indigo-600', 'bg-primary', content)
    content = re.sub(r'bg-gradient-to-tr from-primary to-indigo-500', 'bg-primary', content)
    content = re.sub(r'bg-gradient-to-br from-primary/10 via-indigo-500/10 to-primary/5', 'bg-primary/5', content)

    # Some emerald fixes for standard success accents (we can map to text-success if it's in globals.css, but text-emerald-500 is ok for success. Let's map to success class if possible.
    # The tailwind config might not have `success` in colors. Let's just map them to primary unless they are explicitly success indicators.
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

for root, _, files in os.walk('app'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

print("Color replacements complete.")
