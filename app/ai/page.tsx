"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Settings, Plus, Send, Menu, BrainCircuit } from "lucide-react";
import { AIChatMessage } from "@/lib/ai/providers";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { ArtifactRenderer } from "./components/ArtifactRenderer";

export default function AIChatPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: "assistant", content: "Hello! I am the Tinat AI Research Assistant. How can I help you analyze your study today?" }
  ]);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.6-flash");
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [studies, setStudies] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/auth/studies').then(res => res.json()).then(data => {
      if (data && data.studies) {
        setStudies(data.studies);
        if (data.studies.length > 0) setSelectedStudyId(data.studies[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: AIChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          studyId: selectedStudyId,
          model: selectedModel,
          history: messages.slice(-5)
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
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col h-full`}>
        <div className="p-4 border-b border-gray-200">
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Mock History */}
          <div className="p-3 bg-blue-50 text-blue-700 rounded-md cursor-pointer text-sm font-medium flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Current Chat
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded-md text-gray-500">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-gray-800 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-600" />
              AI Research Workspace
            </h1>
          </div>
          <button onClick={() => setSettingsOpen(!isSettingsOpen)} className="p-2 hover:bg-gray-100 rounded-md text-gray-500">
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-4 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
                ) : (
                  <ArtifactRenderer content={msg.content} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto flex gap-2">
            <textarea
              className="flex-1 resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Ask a question about your study data..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition self-end"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Overlay Sidebar */}
        {isSettingsOpen && (
          <div className="absolute top-14 right-0 w-80 h-[calc(100%-3.5rem)] bg-white border-l border-gray-200 p-6 shadow-xl z-10 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Context Study</h3>
              <select
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={selectedStudyId}
                onChange={(e) => setSelectedStudyId(e.target.value)}
              >
                <option value="">Select a Study...</option>
                {studies.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">The AI will use this study's data to answer your questions.</p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Model</h3>
              <select
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {AVAILABLE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Select the underlying model to power the assistant.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
