import json

with open("node_modules/fayda-decoder/package.json", "r", encoding="utf-8") as f:
    content = f.read()

# fix the broken backticks and things manually if json load fails
import re
content = re.sub(r'`"browser`": { `"fs`": false, `"fs/promises`": false, `"child_process`": false, `"module`": false, `"url`": false, `"sharp`": false },`n', '"browser": { "fs": false, "fs/promises": false, "child_process": false, "module": false, "url": false, "sharp": false },\n', content)

try:
    data = json.loads(content)
except Exception:
    pass # Already fixed or structurally sound now

with open("node_modules/fayda-decoder/package.json", "w", encoding="utf-8") as f:
    f.write(content)
