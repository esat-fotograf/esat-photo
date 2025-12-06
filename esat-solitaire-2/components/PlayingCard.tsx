import React from 'react';
import { CardType, Suit } from '../types';
import { getSuitColor } from '../utils/gameLogic';

interface PlayingCardProps {
  card: CardType;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  className?: string;
  customBackUrl?: string | null;
  isSelected?: boolean;
}

const suitSymbols: Record<Suit, string> = {
  [Suit.HEARTS]: '♥',
  [Suit.DIAMONDS]: '♦',
  [Suit.CLUBS]: '♣',
  [Suit.SPADES]: '♠',
};

const formatRank = (rank: number): string => {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return rank.toString();
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  onClick,
  onDoubleClick,
  onDragStart,
  draggable,
  className = '',
  customBackUrl,
  isSelected
}) => {
  const color = getSuitColor(card.suit);
  const colorClass = color === 'red' ? 'text-red-600' : 'text-slate-900';
  
  if (!card.faceUp) {
    return (
      <div
        className={`relative w-full h-full rounded-lg shadow-md border-2 border-white/20 overflow-hidden cursor-pointer hover:brightness-110 transition-all ${className}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-blue-800 flex items-center justify-center">
            {customBackUrl ? (
                <img src={customBackUrl} alt="card back" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center opacity-90 pattern-grid-lg">
                    <div className="w-16 h-16 rounded-full border-4 border-white/10" />
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`relative w-full h-full bg-white rounded-lg shadow-md select-none overflow-hidden cursor-grab active:cursor-grabbing transition-transform ${isSelected ? 'ring-4 ring-yellow-400 -translate-y-2' : ''} ${className}`}
    >
      {/* Top Left Corner */}
      <div className={`absolute top-1 left-1 flex flex-col items-center ${colorClass}`}>
        <span className="text-sm font-bold leading-none">{formatRank(card.rank)}</span>
        <span className="text-sm leading-none">{suitSymbols[card.suit]}</span>
      </div>

      {/* Center Big Symbol */}
      <div className={`absolute inset-0 flex items-center justify-center ${colorClass} opacity-20`}>
         <span className="text-6xl">{suitSymbols[card.suit]}</span>
      </div>

      {/* Bottom Right Corner (Rotated) */}
      <div className={`absolute bottom-1 right-1 flex flex-col items-center rotate-180 ${colorClass}`}>
        <span className="text-sm font-bold leading-none">{formatRank(card.rank)}</span>
        <span className="text-sm leading-none">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
};