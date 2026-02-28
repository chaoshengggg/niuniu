import type { Card } from './card';

export type MultiplierType =
  | 'five_face_cards'
  | 'face_ace_spades'
  | 'pair'
  | 'sum_ten'
  | 'valid_base_no_bonus'
  | 'no_valid_base';

export interface EvaluationResult {
  multiplier: number;
  type: MultiplierType;
  label: string;
  base: Card[];
  final2: Card[];
  cardValues: Record<string, number>;
}

export const MULTIPLIER_VALUES: Record<MultiplierType, number> = {
  five_face_cards: 7,
  face_ace_spades: 5,
  pair: 3,
  sum_ten: 2,
  valid_base_no_bonus: 1,
  no_valid_base: 0,
};

export const MULTIPLIER_LABELS: Record<MultiplierType, string> = {
  five_face_cards: '五公 (Five Face Cards)',
  face_ace_spades: '公加黑桃A (Face + A♠)',
  pair: '對子 (Pair)',
  sum_ten: '湊十 (Sum to 10)',
  valid_base_no_bonus: '有牛 (Valid Base)',
  no_valid_base: '無牛 (No Valid Base)',
};

/** Big hero display name for each multiplier type */
export const HERO_NAMES: Record<MultiplierType, string> = {
  five_face_cards: '五公',
  face_ace_spades: '公加黑桃A',
  pair: '對子',
  sum_ten: '湊十',
  valid_base_no_bonus: '', // computed as 牛X at runtime
  no_valid_base: '無牛',
};
