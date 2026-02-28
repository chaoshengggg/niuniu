import type { Card } from '../types/card';
import { FACE_RANKS } from '../types/card';
import type { EvaluationResult, MultiplierType } from '../types/evaluation';
import { MULTIPLIER_LABELS, MULTIPLIER_VALUES } from '../types/evaluation';
import { generateSplits } from './combinations';
import { getTransformedValue } from './transform';

function isFaceCard(card: Card): boolean {
  return FACE_RANKS.includes(card.rank);
}

function isAceOfSpades(card: Card): boolean {
  return card.rank === 'A' && card.suit === 'spades';
}

function isValidBase(base: Card[]): boolean {
  const sum = base.reduce((acc, c) => acc + getTransformedValue(c.rank), 0);
  return sum % 10 === 0;
}

function evaluateFinal2(final2: [Card, Card]): { type: MultiplierType; multiplier: number } {
  const [a, b] = final2;

  // Face + Ace of Spades → 5x
  if (
    (isFaceCard(a) && isAceOfSpades(b)) ||
    (isFaceCard(b) && isAceOfSpades(a))
  ) {
    return { type: 'face_ace_spades', multiplier: 5 };
  }

  // Pair by raw rank → 3x
  if (a.rank === b.rank) {
    return { type: 'pair', multiplier: 3 };
  }

  // Sum to a multiple of 10 → 2x (e.g. A+9=10, J+Q=20)
  const sum = getTransformedValue(a.rank) + getTransformedValue(b.rank);
  if (sum % 10 === 0) {
    return { type: 'sum_ten', multiplier: 2 };
  }

  // Valid base but no bonus → 1x
  return { type: 'valid_base_no_bonus', multiplier: 1 };
}

export function evaluateHand(cards: Card[]): EvaluationResult {
  if (cards.length !== 5) {
    return {
      multiplier: 0,
      type: 'no_valid_base',
      label: MULTIPLIER_LABELS.no_valid_base,
      base: [],
      final2: [],
    };
  }

  // Step 1: Five Face Card check → 7x
  if (cards.every(isFaceCard)) {
    return {
      multiplier: MULTIPLIER_VALUES.five_face_cards,
      type: 'five_face_cards',
      label: MULTIPLIER_LABELS.five_face_cards,
      base: cards.slice(0, 3),
      final2: cards.slice(3) as [Card, Card],
    };
  }

  // Step 2-3: Try all splits, find best
  const splits = generateSplits(cards);
  let best: EvaluationResult | null = null;

  for (const split of splits) {
    if (!isValidBase(split.base)) continue;

    const result = evaluateFinal2(split.final2);

    if (!best || result.multiplier > best.multiplier) {
      best = {
        multiplier: result.multiplier,
        type: result.type,
        label: MULTIPLIER_LABELS[result.type],
        base: split.base,
        final2: split.final2,
      };
    }
  }

  if (!best) {
    return {
      multiplier: MULTIPLIER_VALUES.no_valid_base,
      type: 'no_valid_base',
      label: MULTIPLIER_LABELS.no_valid_base,
      base: [],
      final2: [],
    };
  }

  return best;
}
