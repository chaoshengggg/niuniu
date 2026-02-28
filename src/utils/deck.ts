import type { Card, CardId } from '../types/card';
import { RANKS, SUITS } from '../types/card';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}-${suit}` as CardId, rank, suit });
    }
  }
  return deck;
}
