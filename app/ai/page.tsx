"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Plus, Send, BrainCircuit, Sparkles, Database, ChevronDown } from "lucide-react";
import { AIChatMessage } from "@/lib/ai/providers";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { ArtifactRenderer } from "./components/ArtifactRenderer";

export default function AIChatPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: "assistant", content: "Hello! I am the Tinat AI Research Assistant. Select a study to begin analyzing your data." }
  ]);
  const [input, setInput] = useState("");
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.6-flash");
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [studies, setStudies] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/studies').then(res => res.json()).then(data => {
      if (data && data.studies) {
        setStudies(data.studies);
        if (data.studies.length > 0) setSelectedStudyId(data.studies[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: AIChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          studyId: selectedStudyId,
          model: selectedModel,
          history: messages.slice(-10)
        })
      });

      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, an error occurred." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to fetch response." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedStudyTitle = studies.find(s => s.id === selectedStudyId)?.title || "Select Study";
  const selectedModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || "Model";

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative max-w-4xl mx-auto w-full border-x border-slate-100 dark:border-slate-800/50">
        
        {/* Sleek Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold tracking-tight">
            <Sparkles className="w-5 h-5" />
            <span>Tinat AI</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-800"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate max-w-[120px]">{selectedStudyTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button 
              onClick={() => setSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-800"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate max-w-[100px]">{selectedModelName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] ${
                msg.role === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-800 rounded-3xl rounded-tr-sm px-5 py-3.5 text-[15px]' 
                  : 'bg-transparent text-[15px] leading-relaxed w-full'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <ArtifactRenderer content={msg.content} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-slate-400 animate-pulse">Analyzing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 pb-6 pt-10 px-6">
          <div className="relative max-w-3xl mx-auto flex items-end gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm focus-within:shadow-md focus-within:border-indigo-300 dark:focus-within:border-indigo-700/50 transition-all">
            <button className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full shrink-0">
              <Plus className="w-5 h-5" />
            </button>
            <textarea
              className="flex-1 max-h-48 min-h-[44px] resize-none bg-transparent p-2.5 text-[15px] focus:outline-none placeholder:text-slate-400"
              rows={1}
              placeholder="Ask about relationships, outliers, or request a table..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                  e.currentTarget.style.height = 'auto';
                }
              }}
            />
            <button
              onClick={() => {
                handleSend();
                const ta = document.querySelector('textarea');
                if(ta) ta.style.height = 'auto';
              }}
              disabled={!input.trim() || isGenerating}
              className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 shrink-0 mb-0.5 mr-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-400">Tinat AI can make mistakes. Always verify clinical inferences.</span>
          </div>
        </div>

        {/* Settings Overlay */}
        {isSettingsOpen && (
          <div className="absolute top-16 right-6 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl z-20">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Context Study</h3>
              <select
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm outline-none focus:border-indigo-500"
                value={selectedStudyId}
                onChange={(e) => { setSelectedStudyId(e.target.value); setSettingsOpen(false); }}
              >
                <option value="">Select a Study...</option>
                {studies.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">AI Model</h3>
              <select
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm outline-none focus:border-indigo-500"
                value={selectedModel}
                onChange={(e) => { setSelectedModel(e.target.value); setSettingsOpen(false); }}
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
