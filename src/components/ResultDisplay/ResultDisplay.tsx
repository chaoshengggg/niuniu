import type { EvaluationResult } from '../../types/evaluation';
import type { Rank } from '../../types/card';
import { SUIT_SYMBOLS } from '../../types/card';
import { getTransformedValue } from '../../logic/transform';
import styles from './ResultDisplay.module.css';

interface ResultDisplayProps {
  result: EvaluationResult | null;
  selectedCount: number;
}

const TIER_CLASS: Record<number, string> = {
  7: 'tier7',
  5: 'tier5',
  3: 'tier3',
  2: 'tier2',
  1: 'tier1',
  0: 'tier0',
};

function isSwapped(rank: Rank): boolean {
  return rank === '3' || rank === '6';
}

export function ResultDisplay({ result, selectedCount }: ResultDisplayProps) {
  if (selectedCount < 5) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <span className={styles.placeholderIcon}>🃏</span>
          <span className={styles.placeholderText}>
            Select {5 - selectedCount} more card{5 - selectedCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const tierClass = TIER_CLASS[result.multiplier] ?? 'tier0';

  return (
    <div className={`${styles.container} ${styles.hasResult}`}>
      <div className={styles.multiplierRow}>
        <div className={`${styles.badge} ${styles[tierClass]}`}>
          {result.multiplier}x
        </div>
        <div className={styles.labelGroup}>
          <span className={styles.label}>{result.label}</span>
        </div>
      </div>

      {result.type !== 'five_face_cards' && result.type !== 'no_valid_base' && (
        <div className={styles.breakdown}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>Base</span>
            <div className={styles.cardChips}>
              {result.base.map((c) => {
                const tv = getTransformedValue(c.rank);
                const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                return (
                  <span
                    key={c.id}
                    className={styles.chip}
                    data-red={isRed || undefined}
                  >
                    {c.rank}
                    {SUIT_SYMBOLS[c.suit]}
                    {isSwapped(c.rank) && (
                      <span className={styles.transformed}>→{tv}</span>
                    )}
                  </span>
                );
              })}
              <span className={styles.sum}>
                = {result.base.reduce((s, c) => s + getTransformedValue(c.rank), 0)}
              </span>
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>Final 2</span>
            <div className={styles.cardChips}>
              {result.final2.map((c) => {
                const tv = getTransformedValue(c.rank);
                const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                return (
                  <span
                    key={c.id}
                    className={styles.chip}
                    data-red={isRed || undefined}
                  >
                    {c.rank}
                    {SUIT_SYMBOLS[c.suit]}
                    {isSwapped(c.rank) && (
                      <span className={styles.transformed}>→{tv}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
