
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ai, isGeminiConfigured } from '../services/geminiService';
import { supabase } from '../services/database';
import { RealtimeChannel } from '@supabase/supabase-js'; 
import { Chat as GenAIChat } from "@google/genai";

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
  { id: 'init', username: 'Ace', message: 'Yo! Im Ace. I track the tables and crunch the numbers. Ask me anything about odds or strategy.', isBot: true, avatar: getAvatar('Casino Host') }
];

interface ChatProps {
    userAvatar?: string;
    username?: string;
}

// Fallback responses if AI is offline
const OFFLINE_RESPONSES = [
    "Markets are looking choppy. Be careful out there.",
    "If you're playing Blackjack, never split 10s. Rookie mistake.",
    "Martingale is a quick way to get rekt if you hit the table limit.",
    "Green zero is the dream killer. Watch out.",
    "Im updating my neural net, gimme a sec. (Offline)",
    "50/50? Feels more like 40/60 today tbh.",
    "Don't chase losses, friend. Thats how the house wins.",
    "Pattern recognition is a myth in random RNG. Just vibes."
];

const AI_THINKING_PHRASES = [
  "Analyzing table patterns...",
  "Calculating win probabilities...",
  "Consulting strategy engine...",
  "Simulating outcomes...",
  "Reading market sentiment...",
  "Reviewing game rules...",
  "Optimizing advice..."
];

export const Chat: React.FC<ChatProps> = ({ userAvatar, username }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'ai'>('global');
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>(INITIAL_GLOBAL_MESSAGES);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(INITIAL_AI_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingText, setThinkingText] = useState(AI_THINKING_PHRASES[0]);
  
  const globalEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  
  // Persist the Supabase channel
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Gemini Chat Instance
  const chatSession = useRef<GenAIChat | null>(null);

  // --- Thinking Indicator Logic ---
  useEffect(() => {
    if (isTyping) {
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % AI_THINKING_PHRASES.length;
        setThinkingText(AI_THINKING_PHRASES[i]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isTyping]);

  // --- 1. Realtime Global Chat Logic ---
  useEffect(() => {
    if (!supabase) return;

    // Clean up previous channel if exists
    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
    }

    // Create a single persistent channel
    const channel = supabase.channel('global_lounge', {
        config: {
            broadcast: { self: true } // We will receive our own messages too to confirm receipt
        }
    });

    channel
        .on('broadcast', { event: 'message' }, ({ payload }) => {
            // Check if we already have this message (deduplication for self:true)
            setGlobalMessages(prev => {
                if (prev.some(m => m.id === payload.id)) return prev;
                return [...prev.slice(-50), payload as ChatMessage];
            });
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log("Joined Global Chat");
            }
        });

    channelRef.current = channel;

    return () => {
        if (channelRef.current) {
            supabase?.removeChannel(channelRef.current);
        }
    };
  }, []);

  // --- 2. AI Logic ---
  const initChatSession = () => {
    try {
      if (!isGeminiConfigured()) {
          console.warn("Gemini API Key is missing.");
          return;
      }
      
      chatSession.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: "You are Ace, a sharp, witty, and casual crypto gambler and casino host at 'Pump Casino'. You use slang (like 'wagmi', 'rekt', 'degen', 'pump', 'dump'). You give solid gambling advice but keep it brief and entertaining. Never lecture. If asked about future outcomes, say 'RNG is god' or similar.",
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
        id: Date.now().toString() + Math.random().toString().slice(2,6),
        username: myUsername,
        message: input,
        isBot: false,
        avatar: myAvatar
      };
      
      // Optimistically update UI immediately
      setGlobalMessages(prev => [...prev.slice(-50), newMessage]);
      setInput('');

      // Send via the persistent channel
      if (channelRef.current) {
         await channelRef.current.send({
            type: 'broadcast',
            event: 'message',
            payload: newMessage
        }).catch((err: any) => console.error("Broadcast error", err));
      }

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
      setThinkingText(AI_THINKING_PHRASES[0]);

      // Try to re-init if null
      if (!chatSession.current) {
        initChatSession();
      }

      try {
        if (chatSession.current && isGeminiConfigured()) {
          const response = await chatSession.current.sendMessage({ message: prompt });
          const responseText = response.text;

          if (responseText) {
              const aiMsg: ChatMessage = {
                id: Date.now().toString() + '_ai',
                username: 'Ace',
                message: responseText,
                isBot: true,
                avatar: getAvatar('Casino Host')
              };
              setAiMessages(prev => [...prev, aiMsg]);
          } else {
              throw new Error("Empty response");
          }
        } else {
            throw new Error("AI not configured or session null");
        }
      } catch (error) {
           console.warn("AI Error/Offline, using fallback", error);
           
           // Select relevant fallback based on keywords
           let fallbackText = OFFLINE_RESPONSES[Math.floor(Math.random() * OFFLINE_RESPONSES.length)];
           const lowerPrompt = prompt.toLowerCase();
           if (lowerPrompt.includes('blackjack')) fallbackText = "Basic strategy says stand on 17. But sometimes you gotta risk it for the biscuit.";
           if (lowerPrompt.includes('roulette')) fallbackText = "Wheel has no memory, fam. But Red is looking spicy.";
           if (lowerPrompt.includes('martingale')) fallbackText = "Martingale works until you hit the limit and get liquidated. Careful.";

           const fallbackMsg: ChatMessage = {
            id: Date.now().toString() + '_fallback',
            username: 'Ace',
            message: fallbackText,
            isBot: true,
            avatar: getAvatar('Casino Host')
           };
           
           // Add random delay to simulate typing offline
           setTimeout(() => {
               setAiMessages(prev => [...prev, fallbackMsg]);
           }, 1000 + Math.random() * 1500);
      } finally {
          // Keep typing indicator for a split second longer to feel natural
          setTimeout(() => setIsTyping(false), 500);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full hidden lg:flex shadow-2xl relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/50 backdrop-blur shrink-0 z-10">
        <button 
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'global' ? 'text-gold-400 border-b-2 border-gold-400 bg-gold-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          Global Chat
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'ai' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
          Ace (AI)
        </button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 z-10">
        {activeTab === 'global' ? (
           <>
             {globalMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.isBot ? 'opacity-80' : ''} animate-fade-in group`}>
                <div className="relative shrink-0">
                    <img src={msg.avatar} alt={msg.username} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 shadow-lg" />
                    {msg.isBot && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className={`font-bold text-[10px] uppercase tracking-wider truncate ${msg.isBot ? 'text-gold-400' : msg.username === 'You' || msg.username === username ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {msg.username}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed break-words text-xs font-medium">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={globalEndRef} />
           </>
        ) : (
          <>
             {aiMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.username === 'You' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                 <img src={msg.avatar} alt={msg.username} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 shadow-lg shrink-0" />
                 
                 <div className={`flex flex-col max-w-[85%] ${msg.username === 'You' ? 'items-end' : 'items-start'}`}>
                    <span className={`font-bold text-[10px] uppercase mb-1 tracking-wider ${msg.isBot ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {msg.username}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-lg border ${
                        msg.username === 'You' 
                        ? 'bg-slate-700/50 text-white rounded-tr-none border-slate-600' 
                        : 'bg-emerald-900/20 text-emerald-100 rounded-tl-none border-emerald-500/20 backdrop-blur-sm'
                    }`}>
                        {msg.message}
                    </div>
                </div>
              </div>
            ))}
            
            {/* Dynamic Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                 <img src={getAvatar('Casino Host')} alt="AI" className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 shrink-0" />
                 <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex flex-col gap-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest animate-pulse">Ace is thinking...</span>
                    </div>
                    <div className="text-slate-400 text-xs font-mono pl-4 border-l-2 border-slate-600">
                        {thinkingText}
                        <span className="animate-pulse">_</span>
                    </div>
                </div>
              </div>
            )}
            <div ref={aiEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 z-10">
        <div className="relative">
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeTab === 'global' ? "Type a message..." : "Ask Ace for advice..."}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all placeholder-slate-600 text-xs font-medium pr-10 shadow-inner"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-400 p-1 transition-colors disabled:opacity-50" disabled={!input.trim()}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
            </button>
        </div>
      </form>
    </div>
  );
};
