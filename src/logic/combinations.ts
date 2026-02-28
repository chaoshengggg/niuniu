import type { Card } from '../types/card';

export interface Split {
  base: [Card, Card, Card];
  final2: [Card, Card];
}

export function generateSplits(cards: Card[]): Split[] {
  const splits: Split[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      for (let k = j + 1; k < 5; k++) {
        const baseIndices = new Set([i, j, k]);
        const final2 = cards.filter((_, idx) => !baseIndices.has(idx)) as [Card, Card];
        splits.push({
          base: [cards[i], cards[j], cards[k]],
          final2,
        });
      }
    }
  }
  return splits;
}
