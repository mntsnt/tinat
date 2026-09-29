import re

with open("app/projects/[id]/ProjectWorkspaceClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove from activeTab types
content = re.sub(r'\|\s*"milestones"\s*', '', content)
content = re.sub(r'\|\s*"notes"\s*', '', content)
content = re.sub(r'\|\s*"discussions"\s*', '', content)
content = re.sub(r'\|\s*"decisions"\s*', '', content)
content = re.sub(r'\|\s*"outputs"\s*', '', content)

# Remove from the tabs array
content = re.sub(r'\{\s*id:\s*"milestones".*?\},\s*', '', content)
content = re.sub(r'\{\s*id:\s*"notes".*?\},\s*', '', content)
content = re.sub(r'\{\s*id:\s*"discussions".*?\},\s*', '', content)
content = re.sub(r'\{\s*id:\s*"decisions".*?\},\s*', '', content)
content = re.sub(r'\{\s*id:\s*"outputs".*?\},\s*', '', content)

def remove_jsx_block(tab_id):
    global content
    start_str = f'activeTab === "{tab_id}" && ('
    idx = content.find(start_str)
    if idx == -1: return
    
    comment_idx = content.rfind('{/*', 0, idx)
    
    open_paren_idx = idx + len(start_str) - 1
    count = 0
    end_idx = -1
    for i in range(open_paren_idx, len(content)):
        if content[i] == '(': count += 1
        elif content[i] == ')':
            count -= 1
            if count == 0:
                end_idx = i
                break
                
    if end_idx != -1:
        full_start = content.rfind('{', comment_idx, idx)
        full_end = content.find('}', end_idx)
        if full_start != -1 and full_end != -1:
            content = content[:full_start] + content[full_end+1:]

for tab in ["milestones", "notes", "discussions", "decisions", "outputs"]:
    remove_jsx_block(tab)
    
with open("app/projects/[id]/ProjectWorkspaceClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Trimmed!")
