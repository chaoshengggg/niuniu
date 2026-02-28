import type { Rank } from '../types/card';

const TRANSFORM_MAP: Record<Rank, number> = {
  A: 1,
  '2': 2,
  '3': 6,
  '4': 4,
  '5': 5,
  '6': 3,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 10,
  Q: 10,
  K: 10,
};

export function getTransformedValue(rank: Rank): number {
  return TRANSFORM_MAP[rank];
}
