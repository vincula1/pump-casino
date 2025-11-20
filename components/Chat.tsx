
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { ai, isGeminiConfigured } from '../services/geminiService';
import { supabase } from '../services/database';
import { RealtimeChannel } from '@supabase/supabase-js'; 
import { Chat as GenAIChat } from "@google/genai";

// Custom SVG Avatars to ensure they always load
const ACE_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="20" fill="#0f172a"/>
  <circle cx="50" cy="50" r="35" stroke="#10b981" stroke-width="4" fill="#1e293b"/>
  <rect x="30" y="42" width="12" height="8" rx="2" fill="#10b981">
    <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
  </rect>
  <rect x="58" y="42" width="12" height="8" rx="2" fill="#10b981">
    <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" begin="0.5s"/>
  </rect>
  <path d="M35 65 Q50 75 65 65" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
  <path d="M20 25 L30 15 M80 25 L70 15" stroke="#334155" stroke-width="4" stroke-linecap="round"/>
</svg>`)}`;

const SYSTEM_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <rect width="100" height="100" rx="20" fill="#0f172a"/>
  <path d="M50 20 L80 35 V65 L50 80 L20 65 V35 Z" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
  <path d="M50 35 V65 M35 42 L65 58 M65 42 L35 58" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
</svg>`)}`;

const getAvatar = (username: string) => {
    if (username === 'Ace') return ACE_AVATAR_SVG;
    if (username === 'System') return SYSTEM_AVATAR_SVG;
    return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${username}&backgroundColor=1e293b`;
};

const INITIAL_GLOBAL_MESSAGES: ChatMessage[] = [
  { id: '1', username: 'System', message: 'Connected to Global Lounge.', isBot: true, avatar: getAvatar('System') },
];

const INITIAL_AI_MESSAGES: ChatMessage[] = [
  { id: 'init', username: 'Ace', message: "Yo! I'm Ace. I track the tables and crunch the numbers. Ask me anything about strategies or odds.", isBot: true, avatar: getAvatar('Ace') }
];

interface ChatProps {
    userAvatar?: string;
    username?: string;
}

// Fallback responses if AI is offline (Ace Persona)
const OFFLINE_RESPONSES = [
    "House edge is real, bro. Watch your sizing.",
    "Never split 10s. That's rookie behavior.",
    "Martingale works until it doesn't, then you're rekt.",
    "Roulette wheel has no memory. Don't chase the pattern.",
    "Let me check the stats... nah, looks like noise. Just play smart.",
    "50/50 is the best you get. Coin flip life.",
    "Don't tilt. That's how the house wins.",
    "Patterns are a myth in crypto and casinos, fam.",
    "Market is volatile, same as this table.",
    "WAGMI if you have discipline."
];

export const Chat: React.FC<ChatProps> = ({ userAvatar, username }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'ai'>('global');
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>(INITIAL_GLOBAL_MESSAGES);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>(INITIAL_AI_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const globalEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  
  // Persist the Supabase channel
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Gemini Chat Instance
  const chatSession = useRef<GenAIChat | null>(null);

  // --- 1. Realtime Global Chat Logic ---
  useEffect(() => {
    // LISTEN FOR LOCAL EVENTS (For Big Wins when Supabase might be offline/laggy)
    const localHandler = (e: CustomEvent<ChatMessage>) => {
        setGlobalMessages(prev => [...prev.slice(-50), e.detail]);
    };
    window.addEventListener('pump-casino-chat', localHandler as EventListener);

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
        window.removeEventListener('pump-casino-chat', localHandler as EventListener);
        if (channelRef.current) {
            supabase?.removeChannel(channelRef.current);
        }
    };
  }, []);

  // --- 2. AI Logic ---
  const initChatSession = () => {
    try {
      if (!isGeminiConfigured()) {
          return;
      }
      
      chatSession.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: "You are 'Ace', a crypto casino gambler bro. You are tough, use slang like 'rekt', 'moon', 'wagmi', 'alpha'. NEVER use pet names like 'darling', 'honey', 'sweety'. Be concise, slightly cocky but helpful. You analyze gambling strategies seriously.",
        },
      });
    } catch (e) {
      // Silent error
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

      // Try to re-init if null
      if (!chatSession.current) {
        initChatSession();
      }

      const delay = isGeminiConfigured() ? 0 : 1000 + Math.random() * 1000;

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
                avatar: getAvatar('Ace')
              };
              setAiMessages(prev => [...prev, aiMsg]);
          } else {
              throw new Error("Empty response");
          }
        } else {
            throw new Error("AI not configured");
        }
      } catch (error) {
           // Select relevant fallback based on keywords
           let fallbackText = OFFLINE_RESPONSES[Math.floor(Math.random() * OFFLINE_RESPONSES.length)];
           const lowerPrompt = prompt.toLowerCase();
           if (lowerPrompt.includes('blackjack')) fallbackText = "Blackjack? Basic strategy says never take insurance. House edge is thin if you play perfect.";
           if (lowerPrompt.includes('roulette')) fallbackText = "Roulette is pure chaos. The wheel has no memory, don't look for patterns.";
           if (lowerPrompt.includes('martingale')) fallbackText = "Martingale is a quick way to get rekt. Exponential growth hits table limits fast.";
           if (lowerPrompt.includes('win') || lowerPrompt.includes('lost')) fallbackText = "That's the game. Sometimes you moon, sometimes you crash.";

           const fallbackMsg: ChatMessage = {
            id: Date.now().toString() + '_fallback',
            username: 'Ace',
            message: fallbackText,
            isBot: true,
            avatar: getAvatar('Ace')
           };
           
           setTimeout(() => {
               setAiMessages(prev => [...prev, fallbackMsg]);
           }, delay);
      } finally {
          if (isGeminiConfigured()) {
            setIsTyping(false);
          } else {
            setTimeout(() => setIsTyping(false), delay);
          }
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
          Ask Ace (AI)
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
                    <span className={`font-semibold text-xs uppercase truncate ${msg.isSystem ? 'text-gold-500 font-black tracking-wide' : msg.isBot ? 'text-emerald-400' : msg.username === 'You' || msg.username === username ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {msg.username}
                    </span>
                  </div>
                  <p className={`leading-relaxed break-words text-sm ${msg.isSystem ? 'text-white font-bold' : 'text-slate-300'}`}>{msg.message}</p>
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
                 <img src={getAvatar('Ace')} alt="AI" className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shrink-0" />
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
          placeholder={activeTab === 'global' ? "Message Global Lounge..." : "Chat with Ace..."}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-500 text-sm"
        />
      </form>
    </div>
  );
};
