import re

with open('app/components/FaydaVerification.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace previewData.firstName previewData.middleName previewData.lastName with previewData.fullName
content = content.replace('{previewData.firstName} {previewData.middleName} {previewData.lastName}', '{previewData.fullName}')

with open('app/components/FaydaVerification.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
