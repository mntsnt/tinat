import re

with open('app/participant/studies/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div className="container mx-auto px-4 py-8 md:px-6">', '<div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">')

with open('app/participant/studies/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
