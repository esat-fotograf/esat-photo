import { CardType, Suit, Color, Difficulty } from '../types';

export const getSuitColor = (suit: Suit): Color => {
  return (suit === Suit.HEARTS || suit === Suit.DIAMONDS) ? Color.RED : Color.BLACK;
};

export const createDeck = (difficulty: Difficulty = 'hard'): CardType[] => {
  const deck: CardType[] = [];
  
  if (difficulty === 'hard') {
    // 4 Suits: Spades, Hearts, Clubs, Diamonds (13 each)
    const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
    suits.forEach(suit => {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ id: `${suit}-${rank}`, suit, rank, faceUp: false });
      }
    });
  } else if (difficulty === 'medium') {
    // 2 Suits: Spades and Hearts (2 sets of each to make 52 cards)
    const suits = [Suit.SPADES, Suit.HEARTS];
    suits.forEach(suit => {
      // Create 2 sets of each
      for (let set = 0; set < 2; set++) {
        for (let rank = 1; rank <= 13; rank++) {
          deck.push({ id: `${suit}-${rank}-${set}`, suit, rank, faceUp: false });
        }
      }
    });
  } else {
    // Easy: 1 Suit: Spades (4 sets to make 52 cards)
    // Create 4 sets of Spades
    for (let set = 0; set < 4; set++) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ id: `${Suit.SPADES}-${rank}-${set}`, suit: Suit.SPADES, rank, faceUp: false });
      }
    }
  }

  return deck;
};

export const shuffleDeck = (deck: CardType[]): CardType[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

// Check if card can move to a specific foundation pile
export const canMoveToFoundation = (card: CardType, foundationTop: CardType | undefined): boolean => {
  if (!foundationTop) {
    return card.rank === 1; // Ace
  }
  return card.suit === foundationTop.suit && card.rank === foundationTop.rank + 1;
};

export const canMoveToTableau = (card: CardType, tableauTop: CardType | undefined, difficulty: Difficulty): boolean => {
  if (!tableauTop) {
    return card.rank === 13; // King only on empty spot
  }
  
  // Easy Mode (1 Suit): Ignore color, just check rank
  if (difficulty === 'easy') {
     return card.rank === tableauTop.rank - 1;
  }

  // Medium/Hard: Check alternating color + rank
  return getSuitColor(card.suit) !== getSuitColor(tableauTop.suit) && card.rank === tableauTop.rank - 1;
};

// Returns the destination foundation INDEX if move is valid, else null
export const findAutoMoveTarget = (card: CardType, foundations: CardType[][]): number | null => {
  for (let i = 0; i < foundations.length; i++) {
    const pile = foundations[i];
    const topCard = pile.length > 0 ? pile[pile.length - 1] : undefined;
    if (canMoveToFoundation(card, topCard)) {
      return i;
    }
  }
  return null;
};