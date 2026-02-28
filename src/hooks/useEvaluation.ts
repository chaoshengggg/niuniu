import { useMemo } from 'react';
import type { Card, CardId } from '../types/card';
import type { EvaluationResult } from '../types/evaluation';
import { evaluateHand } from '../logic/evaluate';

export function useEvaluation(
  selectedIds: Set<CardId>,
  deck: Card[]
): EvaluationResult | null {
  return useMemo(() => {
    if (selectedIds.size !== 5) return null;
    const cards = deck.filter((c) => selectedIds.has(c.id));
    return evaluateHand(cards);
  }, [selectedIds, deck]);
}
