with open('app/projects/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('        )}\n      </div>\n    </div>\n  );\n}', '        )}\n    </div>\n  );\n}')

with open('app/projects/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
