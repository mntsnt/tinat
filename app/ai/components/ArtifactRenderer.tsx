import React from 'react';
import { Download, Save } from 'lucide-react';

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
    return <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</div>;
  }

  return (
    <div className="space-y-4">
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <div key={idx} className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{part.content}</div>;
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
            <div key={idx} className="my-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <h4 className="font-semibold text-gray-800 text-sm">{part.title}</h4>
                <div className="flex gap-2">
                  <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Save to Project">
                    <Save className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Download CSV">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="px-4 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, rIdx) => (
                      <tr key={rIdx} className="border-t border-gray-100 hover:bg-gray-50/50 transition">
                        {headers.map(h => (
                          <td key={h} className="px-4 py-2.5 text-gray-700">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        return <div key={idx} className="text-gray-500 italic text-sm">[Unsupported Artifact Type: {part.artifactType}]</div>;
      })}
    </div>
  );
}
