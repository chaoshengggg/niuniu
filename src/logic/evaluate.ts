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

/**
 * For cards with rank 3 or 6, both values (3 and 6) are possible.
 * Generate all value assignment combinations for the hand.
 * Each assignment is a Map from Card → effective numeric value.
 */
function generateValueAssignments(cards: Card[]): Map<Card, number>[] {
  const flexCards = cards.filter((c) => c.rank === '3' || c.rank === '6');

  if (flexCards.length === 0) {
    const map = new Map<Card, number>();
    for (const c of cards) map.set(c, getTransformedValue(c.rank));
    return [map];
  }

  const numAssignments = 1 << flexCards.length;
  const maps: Map<Card, number>[] = [];

  for (let mask = 0; mask < numAssignments; mask++) {
    const map = new Map<Card, number>();

    for (const c of cards) {
      if (c.rank !== '3' && c.rank !== '6') {
        map.set(c, getTransformedValue(c.rank));
      }
    }

    for (let i = 0; i < flexCards.length; i++) {
      map.set(flexCards[i], (mask >> i) & 1 ? 6 : 3);
    }

    maps.push(map);
  }

  return maps;
}

function isValidBase(base: Card[], valueMap: Map<Card, number>): boolean {
  const sum = base.reduce((acc, c) => acc + valueMap.get(c)!, 0);
  return sum % 10 === 0;
}

function evaluateFinal2(
  final2: [Card, Card],
  valueMap: Map<Card, number>,
): { type: MultiplierType; multiplier: number } {
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
  const sum = valueMap.get(a)! + valueMap.get(b)!;
  if (sum % 10 === 0) {
    return { type: 'sum_ten', multiplier: 2 };
  }

  // Valid base but no bonus → 1x
  return { type: 'valid_base_no_bonus', multiplier: 1 };
}

function toCardValues(valueMap: Map<Card, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [card, value] of valueMap) result[card.id] = value;
  return result;
}

export function evaluateHand(cards: Card[]): EvaluationResult {
  if (cards.length !== 5) {
    return {
      multiplier: 0,
      type: 'no_valid_base',
      label: MULTIPLIER_LABELS.no_valid_base,
      base: [],
      final2: [],
      cardValues: {},
    };
  }

  // Step 1: Five Face Card check → 7x
  if (cards.every(isFaceCard)) {
    const cardValues: Record<string, number> = {};
    for (const c of cards) cardValues[c.id] = getTransformedValue(c.rank);
    return {
      multiplier: MULTIPLIER_VALUES.five_face_cards,
      type: 'five_face_cards',
      label: MULTIPLIER_LABELS.five_face_cards,
      base: cards.slice(0, 3),
      final2: cards.slice(3) as [Card, Card],
      cardValues,
    };
  }

  // Step 2-3: Try all splits × all value assignments, find best
  const splits = generateSplits(cards);
  const valueMaps = generateValueAssignments(cards);
  let best: EvaluationResult | null = null;
  let bestPoints = -1;

  for (const valueMap of valueMaps) {
    for (const split of splits) {
      if (!isValidBase(split.base, valueMap)) continue;

      const result = evaluateFinal2(split.final2, valueMap);
      const points = (valueMap.get(split.final2[0])! + valueMap.get(split.final2[1])!) % 10;

      // Pick highest multiplier; tiebreak by highest final-2 points
      if (
        !best ||
        result.multiplier > best.multiplier ||
        (result.multiplier === best.multiplier && points > bestPoints)
      ) {
        best = {
          multiplier: result.multiplier,
          type: result.type,
          label: MULTIPLIER_LABELS[result.type],
          base: split.base,
          final2: split.final2,
          cardValues: toCardValues(valueMap),
        };
        bestPoints = points;
      }
    }
  }

  if (!best) {
    return {
      multiplier: MULTIPLIER_VALUES.no_valid_base,
      type: 'no_valid_base',
      label: MULTIPLIER_LABELS.no_valid_base,
      base: [],
      final2: [],
      cardValues: {},
    };
  }

  return best;
}
