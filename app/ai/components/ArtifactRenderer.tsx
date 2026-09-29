import React from 'react';
import { Download, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ArtifactRenderer({ content }: { content: string }) {
  // Regex to extract <ai_artifact type="..." title="...">...</ai_artifact>
  const artifactRegex = /<ai_artifact\s+type="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/ai_artifact>/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = artifactRegex.exec(content)) !== null) {
    // Add text before the artifact
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    const type = match[1];
    const title = match[2];
    const jsonContent = match[3];

    parts.push({
      type: 'artifact',
      artifactType: type,
      title,
      data: jsonContent
    });

    lastIndex = artifactRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return (
      <div className="prose prose-slate prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return (
            <div key={idx} className="prose prose-slate prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>
            </div>
          );
        }

        if (part.type === 'artifact' && part.artifactType === 'table') {
          let data = [];
          try {
            data = JSON.parse(part.data);
          } catch (e) {
            return <div key={idx} className="text-red-500 text-xs border border-red-200 bg-red-50 p-2 rounded">Failed to parse artifact JSON data.</div>;
          }

          if (!Array.isArray(data) || data.length === 0) return null;
          
          const headers = Object.keys(data[0]);

          return (
            <div key={idx} className="my-6 border border-border rounded-lg overflow-hidden shadow-sm bg-card">
              <div className="bg-muted border-b border-border px-4 py-3 flex justify-between items-center">
                <h4 className="font-semibold text-foreground text-sm">{part.title}</h4>
                <div className="flex gap-2">
                  <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition" title="Save to Project">
                    <Save className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition" 
                    title="Download CSV"
                    onClick={() => {
                      const csvRows = [headers.join(',')];
                      data.forEach((r: any) => {
                        const values = headers.map(header => {
                          const val = r[header] || '';
                          return `"${String(val).replace(/"/g, '""')}"`;
                        });
                        csvRows.push(values.join(','));
                      });
                      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.setAttribute('href', url);
                      a.setAttribute('download', `${part.title.replace(/\s+/g, '_').toLowerCase()}.csv`);
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, rIdx) => (
                      <tr key={rIdx} className="border-t border-border hover:bg-muted/50 transition">
                        {headers.map(h => (
                          <td key={h} className="px-4 py-2.5 text-muted-foreground">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return <div key={idx} className="text-muted-foreground italic text-sm">[Unsupported Artifact Type: {part.artifactType}]</div>;
      })}
    </div>
  );
}

