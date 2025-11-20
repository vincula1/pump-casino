
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardSuit } from '../types';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';

interface BlackjackProps {
  onEndGame: (winnings: number) => void;
  balance: number;
}

const DECK_SUITS = [CardSuit.HEARTS, CardSuit.DIAMONDS, CardSuit.CLUBS, CardSuit.SPADES];
const DECK_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const Blackjack: React.FC<BlackjackProps> = ({ onEndGame, balance }) => {
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'finished'>('betting');
  const [bet, setBet] = useState(10);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [resultMessage, setResultMessage] = useState('');
  const [aiCommentary, setAiCommentary] = useState('');
  const [deck, setDeck] = useState<Card[]>([]);

  const createDeck = () => {
    const deck: Card[] = [];
    for (const suit of DECK_SUITS) {
      for (const value of DECK_VALUES) {
        let numValue = parseInt(value);
        if (['J', 'Q', 'K'].includes(value)) numValue = 10;
        if (value === 'A') numValue = 11;
        deck.push({ suit, value, numericValue: numValue });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const calculateScore = (hand: Card[]) => {
    let score = hand.reduce((acc, card) => acc + card.numericValue, 0);
    let aces = hand.filter(c => c.value === 'A').length;
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  };

  const triggerAI = async (context: string) => {
     const msg = await generateHypeMessage(context);
     setAiCommentary(msg);
  };

  const startGame = () => {
    if (balance < bet) return alert("Insufficient funds!");
    playSound('chip');
    onEndGame(-bet);
    const newDeck = createDeck();
    const pHand = [newDeck.pop()!, newDeck.pop()!];
    const dHand = [newDeck.pop()!, newDeck.pop()!];
    setDeck(newDeck);
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setResultMessage('');
    setAiCommentary('');
    
    playSound('cardFlip');
    setTimeout(() => playSound('cardFlip'), 200);

    if (calculateScore(pHand) === 21) {
        triggerAI("Player got a natural Blackjack!");
    } else {
        triggerAI("Blackjack hand started");
    }
  };

  const hit = () => {
    playSound('cardFlip');
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeck(newDeck);
    
    if (calculateScore(newHand) > 21) {
      setGameState('finished');
      setResultMessage('Bust.');
      playSound('lose');
      triggerAI("Player busted at Blackjack");
    }
  };

  const stand = () => {
    playSound('click');
    setGameState('dealerTurn');
  };

  useEffect(() => {
    if (gameState === 'dealerTurn') {
      const playDealer = async () => {
        let currentDealerHand = [...dealerHand];
        let currentDeck = [...deck];
        
        while (calculateScore(currentDealerHand) < 17) {
          await new Promise(r => setTimeout(r, 800));
          playSound('cardFlip');
          const card = currentDeck.pop()!;
          currentDealerHand = [...currentDealerHand, card];
          setDealerHand(currentDealerHand);
          setDeck(currentDeck);
        }

        const pScore = calculateScore(playerHand);
        const dScore = calculateScore(currentDealerHand);
        
        setGameState('finished');
        if (dScore > 21 || pScore > dScore) {
          setResultMessage('You Win');
          onEndGame(bet * 2);
          playSound('win');
          triggerAI("Player wins against dealer in Blackjack");
        } else if (pScore === dScore) {
          setResultMessage('Push');
          onEndGame(bet);
          playSound('click');
          triggerAI("Blackjack push tie");
        } else {
          setResultMessage('Dealer Wins');
          playSound('lose');
          triggerAI("Dealer wins Blackjack hand");
        }
      };
      playDealer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const CardUI: React.FC<{ card: Card, hidden?: boolean, index: number }> = ({ card, hidden, index }) => (
    <div 
      className={`
        w-24 h-36 md:w-32 md:h-44 rounded-xl flex flex-col items-center justify-center shadow-2xl transform transition-all duration-500 
        ${hidden 
            ? 'bg-gradient-to-br from-red-900 to-red-950 border-2 border-white/10' 
            : 'bg-white border border-slate-200 hover:-translate-y-4 hover:rotate-1'
        }
      `}
      style={{ 
        marginLeft: index > 0 ? '-50px' : '0',
        zIndex: index,
        animation: 'slideUp 0.5s ease-out forwards',
        animationDelay: `${index * 0.1}s`,
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {hidden ? (
        // Card Back
        <div className="w-full h-full rounded-xl p-2">
            <div className="w-full h-full border-2 border-dashed border-red-500/30 rounded-lg bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)] flex items-center justify-center">
                 <div className="w-12 h-12 rounded-full bg-red-900/50 border border-red-500/20 flex items-center justify-center">
                    <span className="text-red-500/20 font-serif font-bold text-xl">♠</span>
                 </div>
            </div>
        </div>
      ) : (
        // Card Front
        <div className="relative w-full h-full flex flex-col justify-between p-2 select-none">
          <div className="text-lg font-bold leading-none text-left">
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>{card.value}</div>
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'} text-sm`}>{card.suit}</div>
          </div>
          
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black ${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>
            {card.suit}
          </div>

          <div className="text-lg font-bold leading-none text-right transform rotate-180">
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'}`}>{card.value}</div>
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-rose-600' : 'text-slate-900'} text-sm`}>{card.suit}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* AI Commentary Bar */}
      <div className="w-full max-w-3xl mb-6 min-h-[3rem] flex items-center justify-center">
          {aiCommentary && (
              <div className="bg-slate-900/80 backdrop-blur-md text-emerald-300 px-6 py-2 rounded-full border border-emerald-500/20 shadow-lg shadow-emerald-500/10 animate-fade-in">
                  {aiCommentary}
              </div>
          )}
      </div>

      {/* Table */}
      <div className="w-full bg-[#0f3d2e] rounded-[4rem] p-8 md:p-16 border-[16px] border-[#1a1f2e] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Realistic Felt Texture */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none mix-blend-overlay"></div>
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>
        
        {/* Table Markings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="w-[600px] h-[300px] border-4 border-yellow-500 rounded-[150px]"></div>
            <div className="absolute top-10 text-yellow-500 font-black text-2xl tracking-[0.5em] opacity-50">BLACKJACK PAYS 3 TO 2</div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-between min-h-[450px]">
            {/* Dealer Area */}
            <div className="flex flex-col items-center mb-12">
                <div className="flex justify-center items-center relative h-44 min-w-[200px]">
                    {dealerHand.length === 0 && gameState === 'betting' && (
                        <div className="w-32 h-44 border-2 border-dashed border-emerald-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-emerald-500/20 font-bold tracking-widest uppercase text-xs">Dealer</span>
                        </div>
                    )}
                    {dealerHand.map((c, i) => (
                        <CardUI key={i} card={c} hidden={gameState === 'playing' && i === 0} index={i} />
                    ))}
                </div>
                {gameState !== 'playing' && gameState !== 'betting' && (
                    <div className="mt-4 text-emerald-950 font-black bg-emerald-400 px-6 py-1.5 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-slide-up text-lg">
                        {calculateScore(dealerHand)}
                    </div>
                )}
            </div>

            {/* Result Overlay */}
            {gameState === 'finished' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-[3rem] transition-all duration-300">
                    <div className="text-center animate-slide-up scale-110">
                        <h2 className={`text-7xl font-black mb-6 drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] tracking-tight ${
                            resultMessage.includes('Win') ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600' : 'text-white'
                        }`}>
                            {resultMessage.toUpperCase()}
                        </h2>
                        <Button variant="gold" onClick={() => setGameState('betting')} className="px-16 py-5 text-xl shadow-2xl hover:scale-105 transition-transform border-2 border-yellow-200">
                            PLAY AGAIN
                        </Button>
                    </div>
                </div>
            )}

            {/* Player Area */}
            <div className="flex flex-col items-center">
                <div className="flex justify-center items-center relative h-44 min-w-[200px] mb-6">
                    {playerHand.length === 0 && gameState === 'betting' && (
                        <div className="w-32 h-44 border-2 border-dashed border-emerald-500/20 rounded-xl flex items-center justify-center">
                             <span className="text-emerald-500/20 font-bold tracking-widest uppercase text-xs">Player</span>
                        </div>
                    )}
                    {playerHand.map((c, i) => <CardUI key={i} card={c} index={i} />)}
                </div>
                
                {gameState !== 'betting' && (
                    <div className="mb-2 text-emerald-950 font-black bg-emerald-400 px-6 py-1.5 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)] text-lg">
                        {calculateScore(playerHand)}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 w-full max-w-xl bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        {gameState === 'betting' ? (
          <div className="flex flex-col gap-6 relative z-10">
            <div className="text-center">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] block mb-4">Place Your Wager</label>
                <div className="relative inline-block w-full">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500 text-2xl font-bold">$</span>
                    <input 
                        type="number" 
                        value={bet} 
                        onChange={(e) => setBet(Number(e.target.value))}
                        className="w-full bg-slate-900/80 border border-slate-600 p-5 pl-12 text-white rounded-2xl font-mono text-4xl text-center focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all shadow-inner"
                    />
                </div>
            </div>
            <Button variant="success" onClick={startGame} disabled={balance < bet} fullWidth className="h-20 text-2xl font-black shadow-[0_10px_40px_-10px_rgba(16,185,129,0.4)] tracking-wider">DEAL CARDS</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 relative z-10">
            <Button className="h-20 text-2xl font-black shadow-lg hover:-translate-y-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500" onClick={hit} disabled={gameState !== 'playing'}>
                 HIT
            </Button>
            <Button className="h-20 text-2xl font-black shadow-lg hover:-translate-y-1 bg-rose-600 hover:bg-rose-500 border-rose-500" onClick={stand} disabled={gameState !== 'playing'}>
                 STAND
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
