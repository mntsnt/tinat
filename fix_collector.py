import re

with open('app/collector/dashboard/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div className="container mx-auto px-4 py-8 md:px-8 max-w-4xl">', '<div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">')

with open('app/collector/dashboard/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
