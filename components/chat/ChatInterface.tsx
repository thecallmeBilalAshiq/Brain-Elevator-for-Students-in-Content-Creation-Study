import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Search, Brain, Loader2, Bot, User } from 'lucide-react';
import { generateChatResponse } from '../../services/geminiService';
import ReactMarkdown from 'react-markdown';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<{ role: string; content: string; grounding?: any[] }[]>([
    { role: 'model', content: "Hi! I'm your Study Buddy. Ask me anything or upload notes to discuss!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    thinking: false,
    googleSearch: false,
    googleMaps: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Format history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await generateChatResponse(history, userMsg, config);
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: response.text || "I couldn't generate a text response.",
        grounding: response.grounding
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-surface/50 rounded-2xl glass border border-white/10 overflow-hidden">
      {/* Header / Config */}
      <div className="p-4 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
           <Bot className="text-primary" />
           <h2 className="font-semibold text-lg">Study Buddy Chat</h2>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setConfig(p => ({ ...p, thinking: !p.thinking }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${config.thinking ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'border-white/10 text-gray-400'}`}
           >
             <Brain size={14} /> Thinking (Pro)
           </button>
           <button 
            onClick={() => setConfig(p => ({ ...p, googleSearch: !p.googleSearch, googleMaps: false }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${config.googleSearch ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'border-white/10 text-gray-400'}`}
           >
             <Search size={14} /> Search
           </button>
           <button 
            onClick={() => setConfig(p => ({ ...p, googleMaps: !p.googleMaps, googleSearch: false }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${config.googleMaps ? 'bg-green-600/20 border-green-500 text-green-300' : 'border-white/10 text-gray-400'}`}
           >
             <MapPin size={14} /> Maps
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-primary text-white' 
                : 'bg-white/5 border border-white/10 text-gray-100'
            }`}>
              <div className="prose prose-invert prose-sm">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
              
              {/* Grounding Sources */}
              {msg.grounding && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Sources:</p>
                  {msg.grounding.map((chunk: any, idx: number) => (
                    <div key={idx} className="text-xs">
                       {chunk.web?.uri && (
                         <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                           <Search size={10} /> {chunk.web.title || chunk.web.uri}
                         </a>
                       )}
                       {chunk.maps?.uri && (
                         <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline flex items-center gap-1">
                           <MapPin size={10} /> {chunk.maps.title || "View on Maps"}
                         </a>
                       )}
                    </div>
                  ))}
                </div>
              )}
            </div>
             {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User size={16} className="text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-surface/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a study question..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder:text-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;