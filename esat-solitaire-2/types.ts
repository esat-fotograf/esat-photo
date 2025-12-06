export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades'
}

export enum Color {
  RED = 'red',
  BLACK = 'black'
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CardType {
  id: string;
  suit: Suit;
  rank: number; // 1 (Ace) to 13 (King)
  faceUp: boolean;
}

export interface GameState {
  stock: CardType[];
  waste: CardType[];
  foundations: CardType[][]; // Changed from Record<Suit, ...> to array of piles to support multi-suit of same type
  tableau: CardType[][];
  score: number;
  moves: number;
  startTime: number | null;
  isWon?: boolean;
  difficulty: Difficulty;
}

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
}

export type Language = 'en' | 'ar' | 'tr' | 'de';
export type ViewState = 'welcome' | 'game';

export const CARD_WIDTH = 80;
export const CARD_HEIGHT = 112;