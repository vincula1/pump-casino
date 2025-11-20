
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ai } from '../services/geminiService';
import { supabase } from '../services/database';
import { Chat as GeminiChat } from "@google/genai";

// Cyberpunk/Robot Avatar Style
const AVATAR_BASE_URL = "https://api.dicebear.com/9.x/bottts-neutral/svg";

const getAvatar = (username: string) => {
    if (username === 'Casino Host') return `${AVATAR_BASE_URL}?seed=CasinoHost&backgroundColor=10b981&eyes=sensor`;
    if (username === 'System') return `${AVATAR_BASE_URL}?seed=System&backgroundColor=0f172a`;
    return `${AVATAR_BASE_URL}?seed=${username}`;
};

const INITIAL_GLOBAL_MESSAGES: ChatMessage[] = [
  { id: '1', username: 'System', message: 'Connected to Global Lounge (Live).', isBot: true, avatar: getAvatar('System') },
];

const INITIAL_AI_MESSAGES: ChatMessage[] = [
  { id: 'init', username: 'Casino Host', message: 'Welcome, High Roller. I am here to advise you. Ask me about odds, strategies, or game rules.', isBot: true, avatar: getAvatar('Casino Host') }
];

interface ChatProps {
    userAvatar?: string;
    username?: string;
}

// Fallback responses if AI is offline
const OFFLINE_RESPONSES = [
    "The odds are always in the house's favor, but a smart player knows when to quit.",
    "In Blackjack, always split Aces and Eights.",
    "Martingale strategy is risky: doubling your bet after every loss requires a deep wallet.",
    "For Roulette, betting on Red/Black gives you nearly 50% odds, excluding the Green zero.",
    "I'm currently offline for maintenance, but my advice? Bet with your head, not over it.",
    "A 50/50 chance is the best you'll get in a fair game. Good luck.",
    "Never chase your losses. That's rule #1."
];

export const Chat: React.FC<ChatProps> = ({ userAvatar, username }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'ai'>('global');
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>(INITIAL_GLOBAL_MESSAGES);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(INITIAL_AI_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const globalEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  
  // Gemini Chat Instance
  const chatSession = useRef<GeminiChat | null>(null);

  // --- 1. Realtime Global Chat Logic ---
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('global_lounge');

    channel
        .on('broadcast', { event: 'message' }, ({ payload }) => {
            // Receive message from others
            setGlobalMessages(prev => [...prev.slice(-50), payload as ChatMessage]);
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // --- 2. AI Logic ---
  const initChatSession = () => {
    try {
      chatSession.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: "You are a sophisticated Strategic Gambling Advisor at 'Pump Casino'. You help users make decisions. Explain odds, suggest betting strategies (like Martingale, D'Alembert, Paroli), and clarify rules for Blackjack, Roulette, Slots, and Crash. Be concise (max 2 sentences). Be witty but helpful. If asked about the future, remind them it's random.",
        },
      });
    } catch (e) {
      console.error("AI Init Error", e);
    }
  };

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


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const myUsername = username || 'You';
    // Use the passed userAvatar if available, otherwise fallback to generated
    const myAvatar = userAvatar || getAvatar(myUsername); 

    if (activeTab === 'global') {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        username: myUsername,
        message: input,
        isBot: false,
        avatar: myAvatar
      };
      
      // 1. Update local state immediately
      setGlobalMessages(prev => [...prev.slice(-50), newMessage]);
      
      // 2. Broadcast to others
      if (supabase) {
        await supabase.channel('global_lounge').send({
            type: 'broadcast',
            event: 'message',
            payload: newMessage
        });
      }
      
      setInput('');
    } else {
      // --- AI CHAT ---
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        username: 'You',
        message: input,
        isBot: false,
        avatar: myAvatar
      };
      setAiMessages(prev => [...prev, userMsg]);
      const prompt = input;
      setInput('');
      setIsTyping(true);

      // Re-init if lost
      if (!chatSession.current) {
        initChatSession();
      }

      try {
        if (chatSession.current) {
          const response = await chatSession.current.sendMessage({ message: prompt });
          const responseText = response.text;

          if (responseText) {
              const aiMsg: ChatMessage = {
                id: Date.now().toString() + '_ai',
                username: 'Casino Host',
                message: responseText,
                isBot: true,
                avatar: getAvatar('Casino Host')
              };
              setAiMessages(prev => [...prev, aiMsg]);
          } else {
              throw new Error("Empty response");
          }
        } else {
            throw new Error("Session null");
        }
      } catch (error) {
           console.warn("AI Error, using fallback", error);
           // Fallback logic so AI "works" even without key
           const randomFallback = OFFLINE_RESPONSES[Math.floor(Math.random() * OFFLINE_RESPONSES.length)];
           
           const fallbackMsg: ChatMessage = {
            id: Date.now().toString() + '_fallback',
            username: 'Casino Host',
            message: randomFallback,
            isBot: true,
            avatar: getAvatar('Casino Host')
           };
           setTimeout(() => {
               setAiMessages(prev => [...prev, fallbackMsg]);
           }, 500);
      } finally {
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
          AI Advisor
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-800 scrollbar-thin scrollbar-thumb-slate-600">
        {activeTab === 'global' ? (
           <>
             {globalMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isBot ? 'opacity-90' : ''} animate-fade-in`}>
                <img src={msg.avatar} alt={msg.username} className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`font-semibold text-xs uppercase truncate ${msg.isBot ? 'text-gold-500' : msg.username === 'You' || msg.username === username ? 'text-emerald-400' : 'text-slate-400'}`}>
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
              <div key={msg.id} className={`flex gap-3 ${msg.username === 'You' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                 <img src={msg.avatar} alt={msg.username} className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shrink-0" />
                 
                 <div className={`flex flex-col max-w-[80%] ${msg.username === 'You' ? 'items-end' : 'items-start'}`}>
                    <span className={`font-semibold text-xs uppercase mb-1 ${msg.isBot ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {msg.username}
                    </span>
                    <div className={`p-3 rounded-xl break-words text-sm text-left shadow-lg ${
                        msg.username === 'You' 
                        ? 'bg-slate-600 text-white rounded-tr-none' 
                        : 'bg-slate-900/80 border border-slate-700 text-emerald-100 rounded-tl-none'
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
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
          placeholder={activeTab === 'global' ? "Message Global Lounge..." : "Ask for betting advice..."}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500 text-sm"
        />
      </form>
    </div>
  );
};
