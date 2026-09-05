const fs = require('fs');
const path = require('path');

const mappings = [
  { regex: /text-slate-900/g, replacement: 'text-foreground' },
  { regex: /text-slate-800/g, replacement: 'text-foreground' },
  { regex: /text-slate-700/g, replacement: 'text-foreground' },
  { regex: /text-slate-600/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-500/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-50/g, replacement: 'text-primary-foreground' },
  { regex: /bg-slate-900/g, replacement: 'bg-primary' },
  { regex: /bg-slate-800/g, replacement: 'bg-primary/90' },
  { regex: /bg-slate-50/g, replacement: 'bg-muted/50' },
  { regex: /bg-slate-100/g, replacement: 'bg-muted' },
  { regex: /border-slate-200/g, replacement: 'border-border' },
  { regex: /border-slate-100/g, replacement: 'border-border' },
  { regex: /border-slate-300/g, replacement: 'border-border' },
  { regex: /bg-white/g, replacement: 'bg-card' },
  { regex: /text-emerald-700/g, replacement: 'text-success-foreground' },
  { regex: /text-emerald-600/g, replacement: 'text-success' },
  { regex: /bg-emerald-100/g, replacement: 'bg-success/20' },
  { regex: /text-emerald-800/g, replacement: 'text-success' },
  { regex: /text-amber-800/g, replacement: 'text-amber-600' },
  { regex: /text-amber-900/g, replacement: 'text-amber-500' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      for (const mapping of mappings) {
        content = content.replace(mapping.regex, mapping.replacement);
      }
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'app'));
