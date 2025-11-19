
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
      className={`w-24 h-36 md:w-28 md:h-40 rounded-xl flex flex-col items-center justify-center border-2 shadow-2xl transform transition-all duration-500 hover:-translate-y-2 ${hidden ? 'bg-slate-800 border-gold-600/50' : 'bg-white border-gray-200'}`}
      style={{ 
        animation: 'fadeIn 0.5s ease-out',
        marginLeft: index > 0 ? '-40px' : '0'
      }}
    >
      {hidden ? (
        <div className="w-full h-full rounded-xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 to-slate-900 flex items-center justify-center">
             <div className="w-16 h-24 border-2 border-gold-500/20 rounded flex items-center justify-center">
                <span className="text-gold-500/20 text-4xl font-serif font-bold">P</span>
             </div>
        </div>
      ) : (
        <>
          <div className="absolute top-2 left-2 text-lg font-bold leading-none">
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</div>
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</div>
          </div>
          
          <span className={`text-5xl font-bold font-serif ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
            {card.suit}
          </span>

          <div className="absolute bottom-2 right-2 text-lg font-bold leading-none transform rotate-180">
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>{card.value}</div>
            <div className={`${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* AI Commentary Bar */}
      <div className="w-full max-w-3xl mb-6">
          <div className="bg-slate-900/80 backdrop-blur-md text-gold-400 p-4 rounded-xl border border-slate-700 text-center font-medium min-h-[3.5rem] flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              {aiCommentary && <span className="animate-fade-in">{aiCommentary}</span>}
          </div>
      </div>

      <div className="w-full bg-emerald-900 rounded-[3rem] p-8 md:p-16 border-[16px] border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Felt Texture & Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800 to-emerald-950"></div>
        
        {/* Table Markings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[80%] h-[60%] border-2 border-emerald-400 rounded-[10rem]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-between min-h-[400px]">
            {/* Dealer Area */}
            <div className="flex flex-col items-center mb-12">
            <h3 className="text-emerald-400/60 font-bold mb-4 tracking-[0.2em] uppercase text-xs">Dealer's Hand</h3>
            <div className="flex justify-center pl-10">
                {dealerHand.map((c, i) => (
                <CardUI key={i} card={c} hidden={gameState === 'playing' && i === 0} index={i} />
                ))}
            </div>
            {gameState !== 'playing' && gameState !== 'betting' && (
                <div className="mt-4 text-emerald-900 font-bold bg-emerald-400 px-4 py-1 rounded-full shadow-lg animate-slide-up">{calculateScore(dealerHand)}</div>
            )}
            </div>

            {/* Center Info */}
            {gameState === 'finished' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-[2rem]">
                    <div className="text-center transform animate-slide-up">
                        <h2 className={`text-6xl font-black mb-2 drop-shadow-lg ${resultMessage.includes('Win') ? 'text-gold-400' : 'text-white'}`}>
                            {resultMessage.toUpperCase()}
                        </h2>
                        <Button variant="gold" onClick={() => setGameState('betting')} className="px-12 py-4 text-xl shadow-2xl hover:scale-105">New Deal</Button>
                    </div>
                </div>
            )}

            {/* Player Area */}
            <div className="flex flex-col items-center">
            <div className="flex justify-center pl-10 mb-4">
                {playerHand.map((c, i) => <CardUI key={i} card={c} index={i} />)}
            </div>
            {gameState !== 'betting' && (
                <div className="mb-2 text-emerald-900 font-bold bg-emerald-400 px-4 py-1 rounded-full shadow-lg">{calculateScore(playerHand)}</div>
            )}
            <h3 className="text-emerald-400/60 font-bold tracking-[0.2em] uppercase text-xs">Your Hand</h3>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 w-full max-w-xl bg-slate-800/90 backdrop-blur p-8 rounded-3xl border border-slate-700 shadow-2xl">
        {gameState === 'betting' ? (
          <div className="flex flex-col gap-6">
            <div className="text-center">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-3">Wager Amount</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500 text-xl">$</span>
                    <input 
                        type="number" 
                        value={bet} 
                        onChange={(e) => setBet(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 p-4 pl-10 text-white rounded-xl font-mono text-3xl text-center focus:border-gold-500 outline-none transition-all shadow-inner"
                    />
                </div>
            </div>
            <Button variant="success" onClick={startGame} disabled={balance < bet} fullWidth className="h-16 text-xl font-bold shadow-emerald-900/50 shadow-lg">DEAL CARDS</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <Button className="h-16 text-xl font-bold shadow-lg hover:-translate-y-1" variant="primary" onClick={hit} disabled={gameState !== 'playing'}>HIT</Button>
            <Button className="h-16 text-xl font-bold shadow-lg hover:-translate-y-1" variant="danger" onClick={stand} disabled={gameState !== 'playing'}>STAND</Button>
          </div>
        )}
      </div>
    </div>
  );
};
