import re

with open('app/ask/components/AskDashboardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">', '<div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8 space-y-6">')

with open('app/ask/components/AskDashboardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
