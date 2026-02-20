import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getGroundedAnswer } from '../services/geminiService';
import type { GroundingSource } from '../types';
import { Send, Sparkles, Link as LinkIcon, AlertTriangle, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: GroundingSource[];
}

const ExpertChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! Ask me anything about chicken breeding, egg incubation, or the poultry industry. I'll use Google Search to find the most up-to-date information for you."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { text, sources } = await getGroundedAnswer(userMessage.text);
      const botMessage: Message = { sender: 'bot', text, sources };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const SourceList = ({ sources }: { sources: GroundingSource[] }) => {
    const validSources = sources.filter(s => s.web && s.web.uri);
    if(validSources.length === 0) return null;

    return (
        <div className="mt-3 pt-3 border-t border-white/10">
            <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources</h4>
            <ul className="space-y-2">
                {validSources.map((source, index) => (
                    <li key={index} className="text-xs">
                        <a 
                            href={source.web!.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors group"
                        >
                            <div className="p-1 rounded bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                <LinkIcon className="w-3 h-3" />
                            </div>
                            <span className="truncate opacity-80 group-hover:opacity-100">{source.web!.title || source.web!.uri}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto">
       <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">Ask an Expert</h2>
        <p className="mt-2 text-gray-400">Get AI-powered answers grounded in the latest web search results.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 glass-panel rounded-t-3xl space-y-6 custom-scrollbar">
        {messages.map((msg, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={index} 
            className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}
          >
            {msg.sender === 'bot' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                </div>
            )}
            
            <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              {msg.sources && <SourceList sources={msg.sources} />}
            </div>

            {msg.sender === 'user' && (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 flex-shrink-0 border border-white/10">
                    <User className="w-5 h-5" />
                </div>
            )}
          </motion.div>
        ))}
        
        {loading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
            >
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                 </div>
            </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="glass-panel border-t-0 rounded-b-3xl p-4">
        {error && (
            <div className="mb-4 flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4" /> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
                <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about poultry farming..."
                className="w-full pl-4 pr-4 py-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                disabled={loading}
                />
            </div>
            <button 
                type="submit" 
                disabled={loading || !input.trim()} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
            >
            <Send className="w-5 h-5" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default ExpertChat;
