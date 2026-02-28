import type { EvaluationResult } from '../../types/evaluation';
import { HERO_NAMES } from '../../types/evaluation';
import { SUIT_SYMBOLS } from '../../types/card';
import { useCountUp } from '../../hooks/useCountUp';
import styles from './ResultDisplay.module.css';

interface ResultDisplayProps {
  result: EvaluationResult | null;
  selectedCount: number;
}

function getPointsText(result: EvaluationResult): string {
  if (HERO_NAMES[result.type]) return HERO_NAMES[result.type];
  const pts = (result.final2.reduce((s, c) => s + result.cardValues[c.id], 0)) % 10;
  return pts === 0 ? '牛牛' : `牛${pts}`;
}

export function ResultDisplay({ result, selectedCount }: ResultDisplayProps) {
  const displayMultiplier = useCountUp(result?.multiplier ?? 0);

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

  const landed = displayMultiplier === result.multiplier;

  return (
    <div className={styles.container} data-tier={result.multiplier}>
      {/* Celebration effects for high multipliers */}
      {result.multiplier >= 2 && landed && (
        <div className={styles.celebrationLayer} data-tier={result.multiplier}>
          <div className={styles.sparkle} style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
          <div className={styles.sparkle} style={{ top: '5%', left: '50%', animationDelay: '0.3s' }} />
          <div className={styles.sparkle} style={{ top: '15%', left: '85%', animationDelay: '0.6s' }} />
          <div className={styles.sparkle} style={{ top: '60%', left: '5%', animationDelay: '0.9s' }} />
          <div className={styles.sparkle} style={{ top: '70%', left: '90%', animationDelay: '1.2s' }} />
          {result.multiplier >= 5 && (
            <>
              <div className={styles.sparkle} style={{ top: '30%', left: '20%', animationDelay: '0.4s' }} />
              <div className={styles.sparkle} style={{ top: '45%', left: '75%', animationDelay: '0.7s' }} />
              <div className={styles.sparkle} style={{ top: '80%', left: '40%', animationDelay: '1.0s' }} />
            </>
          )}
        </div>
      )}

      {result.type !== 'no_valid_base' ? (
        <>
          {/* Big centered points / special name */}
          <div className={styles.pointsHero} data-tier={result.multiplier}>
            <span className={styles.pointsValue}>
              {getPointsText(result)}
            </span>
          </div>

          {/* Multiplier meter — big, animated */}
          <div
            className={`${styles.multiplierMeter} ${landed ? styles.meterLanded : ''}`}
            data-tier={landed ? result.multiplier : displayMultiplier}
          >
            <span className={styles.meterValue}>{displayMultiplier}x</span>
            <span className={styles.meterLabel}>{landed ? result.label : ''}</span>
          </div>

          {/* Card arrangement guide */}
          <div className={styles.arrangementGuide}>
            <span className={styles.guideTitle}>How to show your cards</span>
            <div className={styles.cardLayout}>
              {result.type !== 'five_face_cards' ? (
                <>
                  <div className={styles.layoutRow}>
                    <span className={styles.rowLabel}>Final 2</span>
                    <div className={styles.rowCards}>
                      {result.final2.map((c) => {
                        const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                        return (
                          <span key={c.id} className={styles.arrangeCard} data-red={isRed || undefined}>
                            {c.rank}{SUIT_SYMBOLS[c.suit]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className={styles.layoutRow}>
                    <span className={styles.rowLabel}>Base</span>
                    <div className={styles.rowCards}>
                      {result.base.map((c) => {
                        const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                        return (
                          <span key={c.id} className={styles.arrangeCard} data-red={isRed || undefined}>
                            {c.rank}{SUIT_SYMBOLS[c.suit]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.layoutRow}>
                  <div className={styles.rowCards}>
                    {[...result.base, ...result.final2].map((c) => {
                      const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                      return (
                        <span key={c.id} className={styles.arrangeCard} data-red={isRed || undefined}>
                          {c.rank}{SUIT_SYMBOLS[c.suit]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.pointsHero} data-tier={0}>
            <span className={styles.pointsValueMuted}>無牛</span>
          </div>
          <div
            className={`${styles.multiplierMeter} ${styles.meterLanded}`}
            data-tier={0}
          >
            <span className={styles.meterValue}>0x</span>
            <span className={styles.meterLabel}>{result.label}</span>
          </div>
          <div className={styles.arrangementGuide}>
            <span className={styles.guideHintOnly}>
              No 3-card combination sums to a multiple of 10
            </span>
          </div>
        </>
      )}
    </div>
  );
}
