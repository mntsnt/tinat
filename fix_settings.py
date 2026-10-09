import re

with open('app/components/SettingsPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">', '<div className="container mx-auto max-w-3xl px-4 py-6 md:px-7 md:py-8 space-y-8">')

with open('app/components/SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
