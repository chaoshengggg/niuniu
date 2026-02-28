import { describe, it, expect } from 'vitest';
import { evaluateHand } from './evaluate';
import type { Card, Suit } from '../types/card';

function card(rank: Card['rank'], suit: Suit = 'hearts'): Card {
  return { id: `${rank}-${suit}`, rank, suit };
}

describe('evaluateHand', () => {
  it('returns 7x for five face cards', () => {
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('J', 'clubs'),
      card('Q', 'spades'),
    ]);
    expect(result.multiplier).toBe(7);
    expect(result.type).toBe('five_face_cards');
  });

  it('returns 5x for face + ace of spades in final 2', () => {
    // Base: 10 + 10 + 10 = 30 (valid) → final 2: K♣ + A♠
    const result = evaluateHand([
      card('10', 'hearts'),
      card('Q', 'diamonds'),
      card('K', 'clubs'),
      card('K', 'spades'),
      card('A', 'spades'),
    ]);
    expect(result.multiplier).toBe(5);
    expect(result.type).toBe('face_ace_spades');
  });

  it('returns 3x for pair in final 2', () => {
    // Base: 10+10+10=30 (valid), final 2: 7+7 = pair
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('7', 'clubs'),
      card('7', 'spades'),
    ]);
    expect(result.multiplier).toBe(3);
    expect(result.type).toBe('pair');
  });

  it('returns 2x when final 2 transformed values sum to 10', () => {
    // Base: 10+10+10=30 (valid), final 2: 4 + 3(raw 6, transformed 3) = not 10
    // Let's use: base = J+Q+K = 30, final 2 = A(1) + 9(9) = 10
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('A', 'hearts'),
      card('9', 'clubs'),
    ]);
    expect(result.multiplier).toBe(2);
    expect(result.type).toBe('sum_ten');
  });

  it('returns 1x for valid base with no bonus on final 2', () => {
    // Base: 10+10+10=30 (valid), final 2: 2(2)+4(4)=6, no pair, no sum 10
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('2', 'clubs'),
      card('4', 'spades'),
    ]);
    expect(result.multiplier).toBe(1);
    expect(result.type).toBe('valid_base_no_bonus');
  });

  it('returns 0x when no valid base exists', () => {
    // All odd transformed values: A(1), 7(7), 9(9), 5(5), 7(7) — no trio sums to 10
    // 1+7+9=17, 1+7+5=13, 1+9+5=15, 7+9+5=21, 1+7+7=15, 7+7+9=23, 7+7+5=19
    const result = evaluateHand([
      card('A', 'hearts'),
      card('7', 'diamonds'),
      card('9', 'clubs'),
      card('5', 'spades'),
      card('7', 'hearts'),
    ]);
    expect(result.multiplier).toBe(0);
    expect(result.type).toBe('no_valid_base');
  });

  it('handles 3↔6 swap in base correctly', () => {
    // raw 3 → transformed 6, raw 6 → transformed 3
    // Base: 3(→6) + 6(→3) + A(→1) = 10 ✓, final 2: 10+10 = not pair, sum=20 → 1x
    // But also: base could include the 10s. Let's be precise.
    // Cards: 3♥, 6♦, 4♣, 10♠, 10♥
    // Possible base with 3,6,4: transformed 6+3+4=13 ✗
    // Possible base with 3,6,10: transformed 6+3+10=19 ✗
    // Possible base with 3,4,10: transformed 6+4+10=20 ✓ → final2: 6(3)+10(10)=13 → 1x
    // Possible base with 6,4,10: transformed 3+4+10=17 ✗
    // Possible base with 3,10,10: transformed 6+10+10=26 ✗
    // Possible base with 6,10,10: transformed 3+10+10=23 ✗
    // Possible base with 4,10,10: transformed 4+10+10=24 ✗
    // Possible base with 3,6,10(second): same as 3,6,10 = 19 ✗
    // So only valid split: base={3,4,10♠}, final2={6,10♥} → 1x
    const result = evaluateHand([
      card('3', 'hearts'),
      card('6', 'diamonds'),
      card('4', 'clubs'),
      card('10', 'spades'),
      card('10', 'hearts'),
    ]);
    expect(result.multiplier).toBe(1);
    expect(result.type).toBe('valid_base_no_bonus');
  });

  it('3+6 as final 2 is NOT a pair', () => {
    // Base: J+Q+K = 30 (valid), final 2: 3 + 6
    // 3 and 6 have different raw ranks → NOT a pair
    // transformed: 6 + 3 = 9 → not sum 10
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('3', 'clubs'),
      card('6', 'spades'),
    ]);
    expect(result.multiplier).toBe(1);
    expect(result.type).toBe('valid_base_no_bonus');
  });

  it('picks the best combination across all valid bases', () => {
    // Cards: K♠, Q♥, 10♦, A♠, J♣
    // Split 1: base={K,Q,10}=30, final2={A♠,J} → face+A♠ = 5x
    // Split 2: base={K,Q,J}=30, final2={10,A♠} → transformed 10+1=11, not pair → 1x
    // Split 3: base={K,10,J}=30, final2={Q,A♠} → face+A♠ = 5x
    // Split 4: base={Q,10,J}=30, final2={K,A♠} → face+A♠ = 5x
    // Split 5: base={K,10,A♠}=21 ✗
    // etc
    const result = evaluateHand([
      card('K', 'spades'),
      card('Q', 'hearts'),
      card('10', 'diamonds'),
      card('A', 'spades'),
      card('J', 'clubs'),
    ]);
    expect(result.multiplier).toBe(5);
    expect(result.type).toBe('face_ace_spades');
  });

  it('ace of hearts is NOT ace of spades for 5x', () => {
    // Base: J+Q+K = 30, final 2: 10 + A♥ → not face+A♠
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('10', 'clubs'),
      card('A', 'hearts'),
    ]);
    // 10+1=11 → no sum 10, no pair → 1x
    expect(result.multiplier).toBe(1);
    expect(result.type).toBe('valid_base_no_bonus');
  });

  it('pair of 5s gives 3x (pair wins over sum-10)', () => {
    // Base: J+Q+K = 30, final 2: 5+5 → pair=3x AND sum=10=2x → highest is 3x
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('5', 'clubs'),
      card('5', 'spades'),
    ]);
    expect(result.multiplier).toBe(3);
    expect(result.type).toBe('pair');
  });

  it('returns 0x for fewer than 5 cards', () => {
    const result = evaluateHand([card('A'), card('2'), card('3')]);
    expect(result.multiplier).toBe(0);
    expect(result.type).toBe('no_valid_base');
  });

  it('handles sum-10 with 3↔6 swap in final 2', () => {
    // Base: J+Q+K=30, final 2: raw 3(→6) + raw 4(→4) = 10 → 2x
    const result = evaluateHand([
      card('J', 'spades'),
      card('Q', 'hearts'),
      card('K', 'diamonds'),
      card('3', 'clubs'),
      card('4', 'spades'),
    ]);
    expect(result.multiplier).toBe(2);
    expect(result.type).toBe('sum_ten');
  });
});
