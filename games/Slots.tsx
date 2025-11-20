
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/Button';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface SlotsProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

// --- HIGH QUALITY SVG SYMBOLS ---

const SymbolSeven = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
        <defs>
            <linearGradient id="grad7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
        </defs>
        <path d="M20 20 H80 L55 85" stroke="url(#grad7)" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20 H80 L55 85" stroke="rgba(255,255,255,0.4)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const SymbolCherry = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <path d="M50 20 Q70 5 75 35 L80 60" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M50 20 Q30 5 25 35 L20 60" stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="25" cy="65" r="16" fill="#dc2626" />
        <circle cx="75" cy="65" r="16" fill="#dc2626" />
        <circle cx="20" cy="60" r="5" fill="white" opacity="0.4" />
        <circle cx="70" cy="60" r="5" fill="white" opacity="0.4" />
    </svg>
);

const SymbolDiamond = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.8)]">
        <path d="M50 10 L90 45 L50 90 L10 45 Z" fill="#0ea5e9" stroke="#e