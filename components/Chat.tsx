
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { generateHypeMessage, ai } from '../services/geminiService';
import { Chat as GeminiChat } from "@google/genai";

// Cyberpunk/Robot Avatar Style
const AVATAR_BASE_URL = "https://api.dicebear.com/9.x/bottts-neutral/svg";

const getAvatar = (username: string) => {
    if (username === 'Casino Host') return `${AVATAR_BASE_URL}?seed=CasinoHost&backgroundColor=10b981`;
    if (username === 'System') return `${AVATAR_BASE_URL}?seed=System&backgroundColor=0f172a`;
    return `${AVATAR_BASE_URL}?seed=${username}`;
};

const INITIAL_GLOBAL_MESSAGES: ChatMessage[] = [
  { id: '1', username: 'System', message: 'Welcome to the Global Lounge.', isBot: true, avatar: getAvatar('System') },
  { id: '2', username: 'HighRoller', message: 'Good luck everyone.', isBot: false, avatar: getAvatar('HighRoller') },
];

const INITIAL_AI_MESSAGES: ChatMessage[] = [
  { id: 'init', username: 'Casino Host', message: 'Hello! I am your personal casino host. Ask me anything about the games or just chat!', isBot: true, avatar: getAvatar('Casino Host') }
];

interface ChatProps {
    userAvatar?: string;
}

export const Chat: React.FC<ChatProps> = ({ userAvatar }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'ai'>('global');
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>(INITIAL_GLOBAL_MESSAGES);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(INITIAL_AI_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const globalEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  
  // Gemini Chat Instance
  const chatSession = useRef<GeminiChat | null>(null);

  const initChatSession = () => {
    try {
      chatSession.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: "You are a sophisticated, witty, and professional casino host at 'Pump Casino'. You help users with game rules, strategies, or just small talk. Keep responses concise (under 30 words) and stylish. Do not use emojis excessively.",
        },
      });
    } catch (e) {
      console.error("Failed to init AI chat", e);
    }
  };

  // Init AI Chat Session on mount
  useEffect(() => {
    initChatSession();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === 'global') {
      globalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [globalMessages, aiMessages, activeTab, isTyping]);

  // Simulate random live activity in Global Chat
  useEffect(() => {
    const interval = setInterval(async () => {
      if (Math.random() > 0.85) {
        const randomEvents = ['Huge Jackpot', 'New High Score', 'Streak broken', 'Big Win Table 4'];
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        // We can still use the service for quick one-off hype in global chat
        const hype = await generateHypeMessage(event);
        
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          username: 'System',
          message: hype,
          isBot: true,
          avatar: getAvatar('System')
        };
        setGlobalMessages(prev => [...prev.slice(-50), newMessage]);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const myAvatar = userAvatar || getAvatar('You'); 

    if (activeTab === 'global') {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: 'You',
        message: input,
        isBot: false,
        avatar: myAvatar
      };
      setGlobalMessages(prev => [...prev.slice(-50), newMessage]);
      setInput('');
    } else {
      // AI Chat Logic
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        username: 'You',
        message: input,
        isBot: false,
        avatar: myAvatar
      };
      setAiMessages(prev => [...prev, userMsg]);
      const prompt = input;
      setInput(''); // Clear input immediately
      setIsTyping(true);

      // Ensure session exists
      if (!chatSession.current) {
        initChatSession();
      }

      if (chatSession.current) {
        try {
          const response = await chatSession.current.sendMessage({ message: prompt });
          const aiMsg: ChatMessage = {
            id: Date.now().toString() + '_ai',
            username: 'Casino Host',
            message: response.text || "I'm speechless right now.",
            isBot: true,
            avatar: getAvatar('Casino Host')
          };
          setAiMessages(prev => [...prev, aiMsg]);
        } catch (error) {
           console.error("Chat Error", error);
           // Try to reconnect and retry once
           initChatSession();
           try {
              if (chatSession.current) {
                  const retryResponse = await chatSession.current.sendMessage({ message: prompt });
                  const aiMsg: ChatMessage = {
                    id: Date.now().toString() + '_ai_retry',
                    username: 'Casino Host',
                    message: retryResponse.text || "Let's try that again.",
                    isBot: true,
                    avatar: getAvatar('Casino Host')
                  };
                  setAiMessages(prev => [...prev, aiMsg]);
              }
           } catch (retryError) {
              const errorMsg: ChatMessage = {
                id: Date.now().toString() + '_err',
                username: 'Casino Host',
                message: "I seem to be having trouble connecting to the mainframe. Try again in a moment.",
                isBot: true,
                avatar: getAvatar('Casino Host')
              };
              setAiMessages(prev => [...prev, errorMsg]);
           }
        } finally {
          setIsTyping(false);
        }
      } else {
        setIsTyping(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 border-l border-slate-700 w-full hidden lg:flex shadow-xl">
      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-900">
        <button 
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'global' ? 'text-gold-500 border-b-2 border-gold-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Global Chat
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'ai' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
        >
          AI Host
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-800 scrollbar-thin scrollbar-thumb-slate-600">
        {activeTab === 'global' ? (
           <>
             {globalMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isBot ? 'opacity-90' : ''}`}>
                <img src={msg.avatar} alt={msg.username} className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`font-semibold text-xs uppercase truncate ${msg.isBot ? 'text-gold-500' : msg.username === 'You' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {msg.username}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed break-words text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={globalEndRef} />
           </>
        ) : (
          <>
             {aiMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.username === 'You' ? 'flex-row-reverse' : ''}`}>
                 <img src={msg.avatar} alt={msg.username} className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shrink-0" />
                 
                 <div className={`flex flex-col max-w-[80%] ${msg.username === 'You' ? 'items-end' : 'items-start'}`}>
                    <span className={`font-semibold text-xs uppercase mb-1 ${msg.isBot ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {msg.username}
                    </span>
                    <div className={`p-3 rounded-xl break-words text-sm text-left ${
                        msg.username === 'You' 
                        ? 'bg-slate-700 text-white rounded-tr-none' 
                        : 'bg-slate-900/50 border border-slate-700 text-slate-300 rounded-tl-none'
                    }`}>
                        {msg.message}
                    </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                 <img src={getAvatar('Casino Host')} alt="AI" className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shrink-0" />
                 <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl rounded-tl-none flex space-x-1 items-center h-10">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={aiEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeTab === 'global' ? "Chat with players..." : "Ask the host..."}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-slate-500 transition-colors placeholder-slate-500 text-sm"
        />
      </form>
    </div>
  );
};
