'use client';

import { useState } from 'react';
import DashboardSidebar from '../../components/dashboard-sidebar';
import { api } from '../../services/api';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  HelpCircle,
  BookOpen
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  citations?: any[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am your InsightOrion Copilot. I can search across indexed meetings, Gmail emails, Google Drive, and upload documents to answer your queries. Try asking me a question below!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'What are the top risks discussed in Project Alpha?',
    'What decisions were made about GCP VM cloud migration?',
    'Which tasks are currently overdue?',
    'Summarize our compliance policy updates.'
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // User message
    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Calls RAG search
      const result = await api.knowledge.search(textToSend);
      
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: result.answer,
        citations: result.citations
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Error connecting: ${err.message || 'Server offline'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      <DashboardSidebar />

      <main className="flex-1 ml-64 flex flex-col h-screen relative bg-[#0f172a]">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-900 bg-slate-950/40 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-955 font-bold shadow-lg shadow-teal-500/20">
              <Sparkles className="w-5 h-5 animate-pulse text-slate-900" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">AI Copilot Chat</h1>
              <span className="text-[10px] text-slate-400 font-mono">GEMINI_2.5_FLASH_RAG_PIPELINE</span>
            </div>
          </div>
        </div>

        {/* Message Panel Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#0f172a] pb-36">
          {messages.map((m, idx) => {
            const isBot = m.sender === 'assistant';
            return (
              <div 
                key={idx} 
                className={`flex space-x-3.5 max-w-3xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse space-x-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border ${
                  isBot ? 'bg-teal-950/40 border-teal-900/30 text-teal-400' : 'bg-slate-900/60 border border-slate-800 text-slate-350'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl shadow-sm text-xs border leading-relaxed ${
                    isBot 
                      ? 'bg-slate-900/20 border-slate-800 text-slate-200' 
                      : 'bg-slate-950/50 border-slate-850 text-white'
                  }`}>
                    {m.text}
                  </div>

                  {/* Bubble references */}
                  {isBot && m.citations && m.citations.length > 0 && (
                    <div className="bg-slate-955/30 border border-slate-850/80 rounded-lg p-3 space-y-2 max-w-md">
                      <span className="text-[9px] uppercase font-mono text-slate-400 font-bold flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-slate-500" />
                        <span>Reference Sources ({m.citations.length})</span>
                      </span>
                      <div className="divide-y divide-slate-850/60">
                        {m.citations.map((c: any, cIdx: number) => (
                          <div key={cIdx} className="text-[10px] py-1 first:pt-0 last:pb-0 flex items-start space-x-1.5">
                            <span className="text-[9px] bg-teal-955/40 text-teal-450 border border-teal-900/30 px-1 py-0.2 rounded font-mono font-bold shrink-0 mt-0.5">
                              {c.reference_tag}
                            </span>
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">{c.source_title}</span>
                              <p className="text-[9px] text-slate-400 line-clamp-1 italic">{c.content_snippet}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2.5 max-w-xl mr-auto">
              <div className="w-8 h-8 rounded-full bg-teal-955/40 border border-teal-900/30 flex items-center justify-center text-teal-400 shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-2xl shadow-sm text-xs text-slate-400 font-mono flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                <span>generating_rag_response_claims...</span>
              </div>
            </div>
          )}
        </div>

        {/* Prompt triggers & text input overlay (sticky bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent p-8 shrink-0 pointer-events-none">
          <div className="max-w-3xl mx-auto space-y-4 pointer-events-auto">
            
            {/* Sample Prompts grid */}
            {messages.length === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(p)}
                    className="text-left bg-slate-900/20 hover:bg-slate-900/40 border border-slate-800 p-2.5 rounded-lg text-[11px] text-slate-350 hover:text-white transition font-medium flex items-center justify-between group"
                  >
                    <span>{p}</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
              className="relative shadow-md"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Copilot anything..."
                className="w-full bg-slate-955/40 border border-slate-800 focus:border-teal-500/50 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2.5 top-2.5 p-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900/20 text-white disabled:text-slate-500 rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
