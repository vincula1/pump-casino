
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
      setResultMessage('BUST');
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
      className={`w-24 h-36 md:w-32 md:h-44 rounded-xl flex flex-col items-center justify-between p-2 shadow-2xl transform transition-all duration-500 hover:-translate-y-2 select-none relative ${hidden ? 'bg-slate-800 border-2 border-slate-600' : 'bg-white'}`}
      style={{ 
        marginLeft: index > 0 ? '-50px' : '0',
        zIndex: index,
        transform: `rotate(${index * 2 - 2}deg) translateY(${index * -2}px)`
      }}
    >
      {hidden ? (
        <div className="w-full h-full rounded-lg bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-50 flex items-center justify-center">
            <div className="w-10 h-16 rounded-full border-2 border-slate-500/30"></div>
        </div>
      ) : (
        <>
          <div className="w-full flex justify-start">
            <div className={`text-lg font-bold leading-none flex flex-col items-center ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
                <span>{card.value}</span>
                <span className="text-sm">{card.suit}</span>
            </div>
          </div>
          
          <span className={`text-5xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
            {card.suit}
          </span>

          <div className="w-full flex justify-end transform rotate-180">
            <div className={`text-lg font-bold leading-none flex flex-col items-center ${['♥', '♦'].includes(card.suit) ? 'text-red-600' : 'text-slate-900'}`}>
                <span>{card.value}</span>
                <span className="text-sm">{card.suit}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4">
      
      {/* Game Header / Status */}
      <div className="w-full flex justify-between items-center bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-700 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                  Pays 3:2 • Dealer stands on 17
              </div>
          </div>
          <div className="font-mono font-bold text-emerald-400 animate-pulse">
              {gameState === 'betting' ? 'PLACE YOUR BET' : gameState === 'playing' ? 'YOUR TURN' : gameState === 'dealerTurn' ? 'DEALER TURN' : 'ROUND OVER'}
          </div>
      </div>

      {/* Table Surface */}
      <div className="w-full bg-[#203832] rounded-[40px] p-8 md:p-16 border-[12px] border-[#152622] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] relative min-h-[500px] flex flex-col justify-between overflow-hidden">
          
          {/* Dealer Area */}
          <div className="flex flex-col items-center relative z-10">
             <div className="flex items-center gap-2 mb-4 opacity-70">
                 <span className="text-[10px] font-bold uppercase text-white tracking-[0.2em]">Dealer</span>
                 {gameState !== 'playing' && gameState !== 'betting' && (
                     <span className="bg-black/30 px-2 py-0.5 rounded text-white text-xs font-mono">{calculateScore(dealerHand)}</span>
                 )}
             </div>
             <div className="flex justify-center h-44">
                {dealerHand.length > 0 ? dealerHand.map((c, i) => (
                    <CardUI key={i} card={c} hidden={gameState === 'playing' && i === 0} index={i} />
                )) : (
                    <div className="w-32 h-44 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/10 text-sm font-bold">DEALER</div>
                )}
             </div>
          </div>

          {/* Result Overlay */}
          {gameState === 'finished' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-slide-up">
                  <div className={`px-12 py-6 rounded-2xl border-2 shadow-2xl backdrop-blur-xl flex flex-col items-center ${
                      resultMessage === 'YOU WIN' ? 'bg-emerald-900/80 border-emerald-500' :
                      resultMessage === 'BUST' || resultMessage === 'DEALER WINS' ? 'bg-red-900/80 border-red-500' :
                      'bg-slate-800/80 border-slate-500'
                  }`}>
                      <h2 className={`text-4xl font-black uppercase tracking-tighter ${
                          resultMessage === 'YOU WIN' ? 'text-gold-400' : 'text-white'
                      }`}>
                          {resultMessage}
                      </h2>
                      {resultMessage === 'YOU WIN' && <div className="text-gold-200 font-mono mt-2 text-lg">+${bet * 2}</div>}
                  </div>
              </div>
          )}

          {/* Player Area */}
          <div className="flex flex-col items-center relative z-10">
             <div className="flex justify-center h-44 mb-4">
                {playerHand.length > 0 ? playerHand.map((c, i) => (
                    <CardUI key={i} card={c} index={i} />
                )) : (
                    <div className="w-32 h-44 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/10 text-sm font-bold">YOU</div>
                )}
             </div>
             <div className="flex items-center gap-2 opacity-90">
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-[0.2em]">Player</span>
                {playerHand.length > 0 && (
                    <span className="bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded text-xs font-mono font-bold shadow-lg">{calculateScore(playerHand)}</span>
                )}
             </div>
          </div>
      </div>

      {/* Controls */}
      <div className="mt-6 w-full max-w-2xl bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        {gameState === 'betting' ? (
          <div className="flex gap-4 items-center">
             <div className="flex-1">
                 <div className="text-xs text-slate-500 font-bold uppercase mb-2">Wager Amount</div>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500">$</span>
                    <input 
                        type="number" 
                        value={bet}
                        onChange={(e) => setBet(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 h-12 pl-8 rounded-lg text-white font-mono focus:border-gold-500 outline-none"
                    />
                 </div>
             </div>
             <Button variant="success" onClick={startGame} disabled={balance < bet} className="h-12 px-8 text-lg font-bold">DEAL CARDS</Button>
          </div>
        ) : (
           <div className="flex justify-center gap-4">
              <Button 
                variant="primary" 
                onClick={hit} 
                disabled={gameState !== 'playing'} 
                className="w-32 h-14 rounded-full text-lg font-bold bg-slate-800 border-2 border-slate-600 hover:bg-slate-700"
              >
                HIT
              </Button>
              <Button 
                variant="danger" 
                onClick={stand} 
                disabled={gameState !== 'playing'} 
                className="w-32 h-14 rounded-full text-lg font-bold bg-rose-600 border-2 border-rose-800 hover:bg-rose-500"
              >
                STAND
              </Button>
              {gameState === 'finished' && (
                 <Button 
                    variant="gold" 
                    onClick={() => setGameState('betting')} 
                    className="w-40 h-14 rounded-full text-lg font-bold shadow-[0_0_20px_#fbbf24]"
                 >
                    NEW HAND
                 </Button>
              )}
           </div>
        )}
      </div>

      {/* AI Commentary */}
      {aiCommentary && (
          <div className="fixed bottom-6 right-6 z-50 max-w-xs bg-slate-900/90 backdrop-blur p-4 rounded-xl border border-emerald-500/30 shadow-2xl animate-slide-up">
              <div className="flex items-center gap-2 mb-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Ace says</span>
              </div>
              <p className="text-sm text-slate-200">{aiCommentary}</p>
          </div>
      )}

    </div>
  );
};
