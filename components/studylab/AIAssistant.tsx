import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Brain, Zap, Sparkles, HelpCircle, GraduationCap, FileText, Activity } from 'lucide-react';
import { generateChatResponse } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Message, ToolConfig } from '../../types';

interface AIAssistantProps {
  initialContext?: string;
  isMobileExpanded?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ initialContext, isMobileExpanded }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm your AI Study Buddy. I can help analyze your notes, quiz you, or explain complex topics.", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ToolConfig>({
    thinking: false,
    googleSearch: false,
    googleMaps: false,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      // Append context from notes if available and not too long
      let contextMsg = userMsg;
      if (initialContext && messages.length < 3) {
        contextMsg = `Context from my notes:\n${initialContext.substring(0, 2000)}\n\nMy Question: ${userMsg}`;
      }

      const response = await generateChatResponse(history, contextMsg, config);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: response.text || "I couldn't generate a response.",
        grounding: response.grounding,
        timestamp: Date.now()
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const chips = [
    { label: "Explain this", icon: HelpCircle },
    { label: "Quiz me", icon: GraduationCap },
    { label: "Summarize", icon: FileText },
    { label: "Find gaps", icon: Activity },
  ];

  return (
    <div className={`flex flex-col h-full bg-[#0F0F1A] border-l border-white/5 ${isMobileExpanded ? 'fixed inset-0 z-50 pt-16' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0F0F1A]">
        <div className="flex items-center gap-2 text-[#8B5CF6] font-semibold">
           <Sparkles size={18} className="fill-current" />
           <span>AI Study Buddy</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0F0F1A] bg-[radial-gradient(#8B5CF6_0.5px,transparent_0.5px)] [background-size:24px_24px] [background-position:0_0] relative">
        <div className="absolute inset-0 bg-[#0F0F1A]/95 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#1E1E2E] text-white border border-white/10 rounded-br-none' 
                  : 'bg-[#8B5CF6]/10 text-gray-100 border border-[#8B5CF6]/20 rounded-bl-none'
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                
                {msg.grounding && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                     <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Sources</p>
                     {msg.grounding.map((chunk, idx) => (
                        <div key={idx} className="flex flex-col gap-1 text-xs">
                           {chunk.web?.uri && (
                               <a href={chunk.web.uri} target="_blank" className="text-blue-400 hover:underline flex gap-1 items-center bg-blue-500/10 p-1.5 rounded w-fit">
                                  <Search size={10} /> {chunk.web.title || "Web Source"}
                               </a>
                           )}
                           {chunk.maps?.uri && (
                               <a href={chunk.maps.uri} target="_blank" className="text-green-400 hover:underline flex gap-1 items-center bg-green-500/10 p-1.5 rounded w-fit">
                                  <MapPin size={10} /> {chunk.maps.title || "Location"}
                               </a>
                           )}
                        </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start">
                <div className="bg-[#8B5CF6]/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2 border border-[#8B5CF6]/20">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1.5 h-1.5 bg-[#8B5CF6] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                   </div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-[#0F0F1A] shrink-0 space-y-3">
         {/* Chips */}
         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {chips.map(chip => (
                <button 
                  key={chip.label}
                  onClick={() => setInput(prev => `${chip.label} ${prev}`)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30 transition flex items-center gap-1.5"
                >
                  <chip.icon size={12} />
                  {chip.label}
                </button>
            ))}
         </div>
         
         <div className="flex gap-2 relative">
            <input
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder="Ask anything..."
               className="flex-1 bg-[#1E1E2E] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#8B5CF6]/50 placeholder:text-gray-600"
            />
            <div className="absolute right-14 top-1/2 -translate-y-1/2 flex gap-1">
               <button 
                  onClick={() => setConfig(c => ({...c, thinking: !c.thinking}))}
                  className={`p-1.5 rounded-lg transition ${config.thinking ? 'text-[#8B5CF6] bg-[#8B5CF6]/10' : 'text-gray-500 hover:text-gray-300'}`}
                  title="Thinking Mode"
               >
                  <Brain size={16} />
               </button>
            </div>
            <button 
               onClick={handleSend}
               disabled={isLoading || !input}
               className="p-3 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8B5CF6]/20 transition-all active:scale-95"
            >
               <Send size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default AIAssistant;