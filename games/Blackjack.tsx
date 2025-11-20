
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
      setResultMessage('BUSTED');
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
          setResultMessage('YOU WIN');
          onEndGame(bet * 2);
          playSound('win');
          triggerAI("Player wins against dealer in Blackjack");
        } else if (pScore === dScore) {
          setResultMessage('PUSH');
          onEndGame(bet);
          playSound('click');
          triggerAI("Blackjack push tie");
        } else {
          setResultMessage('DEALER WINS');
          playSound('lose');
          triggerAI("Dealer wins Blackjack hand");
        }
      };
      playDealer();
    }
  }, [gameState]);

  const CardUI: React.FC<{ card: Card, hidden?: boolean, index: number }> = ({ card, hidden, index }) => (
    <div 
      className={`w-28 h-40 md:w-36 md:h-52 rounded-xl flex flex-col items-center justify-between border bg-white shadow-2xl transform transition-all duration-500 hover:-translate-y-4 select-none ${hidden ? 'bg-slate-800 border-emerald-500/50' : 'border-gray-300'}`}
      style={{ 
        marginLeft: index > 0 ? '-60px' : '0',
        zIndex: index
      }}
    >
      {hidden ? (
        <div className="w-full h-full rounded-xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 to-slate-900 flex items-center justify-center border-4 border-slate-600">
             <div className="text-slate-500 text-4xl font-serif">♠</div>
        </div>
      ) : (
        <>
          <div className="w-full p-2 flex justify-start">
            <div className={`text-2xl font-bold leading-none flex flex-col items-center ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-800'}`}>
                <span>{card.value}</span>
                <span className="text-xl">{card.suit}</span>
            </div>
          </div>
          
          <span className={`text-6xl ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-800'}`}>
            {card.suit}
          </span>

          <div className="w-full p-2 flex justify-end transform rotate-180">
            <div className={`text-2xl font-bold leading-none flex flex-col items-center ${['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-slate-800'}`}>
                <span>{card.value}</span>
                <span className="text-xl">{card.suit}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
      
      {/* Status Bar */}
      <div className="w-full max-w-3xl h-16 bg-emerald-950 border border-emerald-900 rounded-2xl flex items-center justify-between px-8 mb-8 shadow-xl relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-20"></div>
         
         <div className="z-10 flex gap-4 text-sm font-bold tracking-widest uppercase text-emerald-400/60">
            <span>Min $10</span>
            <span>Pays 2:1</span>
         </div>

         {/* Dynamic Status Text */}
         <div className="z-10 absolute left-1/2 -translate-x-1/2 text-xl font-black tracking-wider text-white">
             {gameState === 'betting' && <span className="animate-pulse text-gold-400">PLACE YOUR BET</span>}
             {gameState === 'playing' && <span>YOUR TURN</span>}
             {gameState === 'dealerTurn' && <span>DEALER'S TURN...</span>}
             {gameState === 'finished' && (
                 <span className={`${resultMessage === 'YOU WIN' ? 'text-gold-400' : resultMessage === 'BUSTED' ? 'text-red-500' : 'text-slate-300'}`}>
                     {resultMessage}
                 </span>
             )}
         </div>
      </div>

      {/* Table Surface */}
      <div className="w-full bg-[#064e3b] rounded-[3rem] p-10 md:p-20 border-8 border-[#063c2e] shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] relative min-h-[600px] flex flex-col justify-between">
          
          {/* Dealer Side */}
          <div className="flex flex-col items-center">
             <div className="flex justify-center mb-2">
                {dealerHand.map((c, i) => (
                    <CardUI key={i} card={c} hidden={gameState === 'playing' && i === 0} index={i} />
                ))}
             </div>
             {gameState !== 'betting' && (
                 <div className="flex items-center gap-2 mt-4">
                     <span className="text-xs font-bold uppercase text-emerald-200/50 tracking-widest">Dealer</span>
                     {gameState !== 'playing' && (
                         <div className="bg-black/40 px-3 py-1 rounded-full text-white font-mono font-bold text-sm">
                             {calculateScore(dealerHand)}
                         </div>
                     )}
                 </div>
             )}
          </div>

          {/* Center Interaction Area (Result) */}
          <div className="flex-1 flex items-center justify-center py-8">
              {gameState === 'finished' && (
                  <div className="bg-black/50 backdrop-blur-md px-12 py-6 rounded-2xl border border-white/10 animate-slide-up">
                      <h2 className={`text-4xl font-black uppercase tracking-tighter ${resultMessage === 'YOU WIN' ? 'text-gold-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-white'}`}>
                          {resultMessage}
                      </h2>
                      {resultMessage === 'YOU WIN' && <p className="text-center text-gold-200 font-mono mt-2">+${bet}</p>}
                  </div>
              )}
          </div>

          {/* Player Side */}
          <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase text-emerald-200/50 tracking-widest">You</span>
                {gameState !== 'betting' && (
                     <div className="bg-emerald-500 text-emerald-950 px-3 py-1 rounded-full font-mono font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                         {calculateScore(playerHand)}
                     </div>
                 )}
             </div>
             <div className="flex justify-center">
                {playerHand.map((c, i) => (
                    <CardUI key={i} card={c} index={i} />
                ))}
             </div>
          </div>
      </div>

      {/* Controls */}
      <div className="mt-8 w-full max-w-xl">
        {gameState === 'betting' ? (
          <div className="flex gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
             <div className="flex-1 relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500">$</span>
                 <input 
                    type="number" 
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 h-14 pl-8 rounded-xl text-white text-xl font-mono outline-none focus:border-gold-500"
                 />
             </div>
             <Button variant="success" onClick={startGame} disabled={balance < bet} className="w-40 h-14 text-lg font-bold">DEAL</Button>
          </div>
        ) : (
           <div className="flex justify-center gap-4">
              <Button 
                variant="primary" 
                onClick={hit} 
                disabled={gameState !== 'playing'} 
                className="w-32 h-16 rounded-full text-xl font-bold shadow-xl border-2 border-slate-600 bg-slate-800 hover:bg-slate-700"
              >
                HIT
              </Button>
              <Button 
                variant="danger" 
                onClick={stand} 
                disabled={gameState !== 'playing'} 
                className="w-32 h-16 rounded-full text-xl font-bold shadow-xl border-2 border-red-800 bg-red-600 hover:bg-red-500"
              >
                STAND
              </Button>
              {gameState === 'finished' && (
                 <Button 
                    variant="gold" 
                    onClick={() => setGameState('betting')} 
                    className="w-48 h-16 rounded-full text-xl font-bold shadow-xl animate-pulse"
                 >
                    NEW HAND
                 </Button>
              )}
           </div>
        )}
      </div>

      {/* AI Commentary Toast */}
      {aiCommentary && (
          <div className="fixed bottom-8 right-8 max-w-xs bg-slate-900/90 backdrop-blur border border-emerald-500/30 p-4 rounded-xl shadow-2xl animate-slide-up z-50">
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Ace Analysis</span>
              </div>
              <p className="text-sm text-slate-200">{aiCommentary}</p>
          </div>
      )}

    </div>
  );
};
