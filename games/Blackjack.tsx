
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardSuit } from '../types';
import { generateHypeMessage } from '../services/geminiService';
import { playSound } from '../services/audioService';
import { ResultOverlay } from '../components/ui/ResultOverlay';

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
  const [resultMessage, setResultMessage] = useState<'WIN' | 'LOSE' | 'PUSH' | ''>('');
  const [payout, setPayout] = useState(0);
  const [aiCommentary, setAiCommentary] = useState('');
  const [deck, setDeck] = useState<Card[]>([]);
  const [streak, setStreak] = useState(0);

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
    if (balance < bet) return;
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
    setPayout(0);
    setAiCommentary('');
    
    playSound('cardFlip');
    setTimeout(() => playSound('cardFlip'), 200);

    if (calculateScore(pHand) === 21) {
        triggerAI("Blackjack dealt!");
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
      setResultMessage('LOSE');
      setPayout(-bet);
      setStreak(0); // Reset Streak
      playSound('lose');
      triggerAI("Busted.");
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
          setResultMessage('WIN');
          setPayout(bet * 2); 
          setStreak(s => s + 1); // Increment Streak
          onEndGame(bet * 2);
          playSound('win');
          triggerAI("Player wins hand.");
        } else if (pScore === dScore) {
          setResultMessage('PUSH');
          setPayout(bet);
          setStreak(0); // Reset Streak
          onEndGame(bet);
          playSound('click');
          triggerAI("Push. Money back.");
        } else {
          setResultMessage('LOSE');
          setPayout(-bet);
          setStreak(0); // Reset Streak
          playSound('lose');
          triggerAI("House wins.");
        }
      };
      playDealer();
    }
  }, [gameState]);

  const CardUI: React.FC<{ card: Card, hidden?: boolean, index: number }> = ({ card, hidden, index }) => (
    <div 
      className={`w-28 h-40 md:w-36 md:h-52 rounded-xl flex flex-col justify-between p-3 shadow-2xl transition-all duration-500 select-none relative border border-slate-200
        ${hidden ? 'bg-slate-800 border-slate-600' : 'bg-white'}
      `}
      style={{ 
        marginLeft: index > 0 ? '-60px' : '0',
        zIndex: index,
        transform: `translateY(${index * 2}px)`
      }}
    >
      {hidden ? (
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-600"></div>
        </div>
      ) : (
        <>
          <div className="w-full flex justify-start">
            <div className={`text-2xl font-bold leading-none flex flex-col items-center ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
                <span>{card.value}</span>
                <span className="text-lg">{card.suit}</span>
            </div>
          </div>
          
          <span className={`text-6xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
            {card.suit}
          </span>

          <div className="w-full flex justify-end transform rotate-180">
            <div className={`text-2xl font-bold leading-none flex flex-col items-center ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
                <span>{card.value}</span>
                <span className="text-lg">{card.suit}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      
      {/* CLEAN TABLE SURFACE */}
      <div className="w-full bg-emerald-900 rounded-[3rem] p-8 md:p-12 border-[1px] border-emerald-800 shadow-2xl relative min-h-[600px] flex flex-col justify-between overflow-hidden">
          
          {/* Result Overlay */}
          {gameState === 'finished' && resultMessage && (
             <ResultOverlay result={resultMessage} amount={resultMessage === 'WIN' ? payout - bet : resultMessage === 'PUSH' ? 0 : -bet} />
          )}

          {/* TOP STATUS BAR */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-black/20 backdrop-blur flex items-center justify-between px-8 border-b border-emerald-800/30">
               <div className="text-emerald-400/70 font-bold text-xs uppercase tracking-widest hidden md:block">Blackjack Pays 3:2</div>
               
               <div className="flex items-center gap-4">
                  {gameState !== 'betting' && (
                      <div className={`px-4 py-1 rounded-full text-sm font-bold tracking-wider animate-fade-in bg-black/40 text-white`}>
                          {gameState === 'finished' ? 'ROUND OVER' : gameState === 'dealerTurn' ? "DEALER'S TURN" : "YOUR TURN"}
                      </div>
                  )}
                  
                  {/* STREAK INDICATOR */}
                  {streak > 0 && (
                    <div className="flex items-center gap-1 animate-bounce bg-orange-500/20 border border-orange-500/50 px-3 py-1 rounded-full">
                      <span className="text-lg">🔥</span>
                      <span className="text-orange-400 font-black font-mono">{streak}</span>
                    </div>
                  )}
               </div>

               <div className="text-emerald-400/70 font-bold text-xs uppercase tracking-widest hidden md:block">Dealer stands on 17</div>
          </div>

          {/* Dealer Area */}
          <div className="flex flex-col items-center mt-12 relative z-10">
             <div className="flex justify-center h-52">
                {dealerHand.length > 0 ? dealerHand.map((c, i) => (
                    <CardUI key={i} card={c} hidden={gameState === 'playing' && i === 0} index={i} />
                )) : (
                    <div className="w-36 h-52 border-2 border-dashed border-emerald-700/50 rounded-xl flex items-center justify-center text-emerald-700/50 font-bold">DEALER</div>
                )}
             </div>
             {dealerHand.length > 0 && (
                 <div className="mt-4 bg-black/30 px-3 py-1 rounded-full text-emerald-100 font-mono font-bold text-sm">
                     {gameState === 'playing' ? '?' : calculateScore(dealerHand)}
                 </div>
             )}
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center relative z-10 mb-4">
             {playerHand.length > 0 && (
                 <div className="mb-4 bg-emerald-500 text-emerald-950 px-4 py-1 rounded-full font-mono font-bold text-lg shadow-lg">
                     {calculateScore(playerHand)}
                 </div>
             )}
             <div className="flex justify-center h-52">
                {playerHand.length > 0 ? playerHand.map((c, i) => (
                    <CardUI key={i} card={c} index={i} />
                )) : (
                    <div className="w-36 h-52 border-2 border-dashed border-emerald-700/50 rounded-xl flex items-center justify-center text-emerald-700/50 font-bold">PLAYER</div>
                )}
             </div>
          </div>
      </div>

      {/* CONTROLS */}
      <div className="mt-8 w-full max-w-xl relative z-20">
        {gameState === 'betting' ? (
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex gap-4 items-center">
             <div className="flex-1">
                 <div className="text-xs text-slate-500 font-bold uppercase mb-1">Bet Amount</div>
                 <input 
                    type="number" 
                    value={bet}
                    onChange={(e) => setBet(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 h-12 pl-4 rounded-lg text-white font-mono text-lg focus:border-emerald-500 outline-none"
                />
             </div>
             <Button variant="success" onClick={startGame} disabled={balance < bet} className="h-14 px-8 text-lg font-bold rounded-xl">DEAL</Button>
          </div>
        ) : (
           <div className="flex justify-center gap-4">
              {gameState === 'playing' && (
                  <>
                    <Button variant="primary" onClick={hit} className="w-32 h-16 rounded-xl text-xl font-bold bg-emerald-600 hover:bg-emerald-500 border-emerald-700">HIT</Button>
                    <Button variant="danger" onClick={stand} className="w-32 h-16 rounded-xl text-xl font-bold">STAND</Button>
                  </>
              )}
              {gameState === 'finished' && (
                 <Button variant="gold" onClick={() => setGameState('betting')} className="w-48 h-16 rounded-xl text-xl font-bold animate-bounce shadow-lg shadow-gold-500/20">NEW HAND</Button>
              )}
           </div>
        )}
      </div>

      {/* AI Commentary Toast */}
      {aiCommentary && (
          <div className="fixed bottom-8 right-8 z-50 bg-slate-900/90 backdrop-blur px-6 py-4 rounded-xl border border-emerald-500/20 shadow-2xl animate-slide-up max-w-xs pointer-events-none">
              <p className="text-emerald-400 text-sm font-medium">{aiCommentary}</p>
          </div>
      )}

    </div>
  );
};
