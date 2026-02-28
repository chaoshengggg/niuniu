import { useEffect } from 'react';
import type { Card as CardType, CardId } from '../../types/card';
import { SUITS, SUIT_SYMBOLS } from '../../types/card';
import type { EvaluationResult } from '../../types/evaluation';
import { useCamera } from '../../hooks/useCamera';
import styles from './CameraScanner.module.css';

interface CameraScannerProps {
  deck: CardType[];
  selectedIds: Set<CardId>;
  onToggle: (card: CardType) => void;
  onClear: () => void;
  onClose: () => void;
  result: EvaluationResult | null;
}

export function CameraScanner({
  deck,
  selectedIds,
  onToggle,
  onClear,
  onClose,
  result,
}: CameraScannerProps) {
  const { videoRef, error, start, stop } = useCamera();
  const maxSelected = selectedIds.size >= 5;

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  const suitGroups = SUITS.map((suit) => ({
    suit,
    symbol: SUIT_SYMBOLS[suit],
    cards: deck.filter((c) => c.suit === suit),
  }));

  const selectedCards = deck.filter((c) => selectedIds.has(c.id));

  return (
    <div className={styles.overlay}>
      {/* Camera feed */}
      <div className={styles.cameraSection}>
        {error ? (
          <div className={styles.cameraError}>
            <span className={styles.cameraErrorIcon}>📷</span>
            <span className={styles.cameraErrorText}>{error}</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
            muted
          />
        )}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close scanner">
          ✕
        </button>
      </div>

      {/* Selected cards strip + result */}
      <div className={styles.middleStrip}>
        <span className={styles.counter}>
          <span className={styles.counterCurrent}>{selectedIds.size}</span>/5
        </span>
        <div className={styles.chipList}>
          {selectedCards.map((c) => {
            const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
            return (
              <span
                key={c.id}
                className={styles.chip}
                data-red={isRed || undefined}
                onClick={() => onToggle(c)}
              >
                {c.rank}{SUIT_SYMBOLS[c.suit]}
              </span>
            );
          })}
        </div>
        {result && (
          <span className={styles.resultBadge}>
            {result.multiplier}x {result.label.split(' ')[0]}
          </span>
        )}
        {selectedIds.size > 0 && !result && (
          <button className={styles.counter} onClick={onClear} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Compact card picker */}
      <div className={styles.pickerSection}>
        {suitGroups.map(({ suit, symbol, cards }) => (
          <div key={suit} className={styles.suitRow}>
            <span
              className={styles.suitIcon}
              data-red={suit === 'hearts' || suit === 'diamonds' || undefined}
            >
              {symbol}
            </span>
            <div className={styles.cardGrid}>
              {cards.map((card) => {
                const selected = selectedIds.has(card.id);
                const disabled = maxSelected && !selected;
                const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
                return (
                  <button
                    key={card.id}
                    className={`${styles.miniCard} ${selected ? styles.miniCardSelected : ''} ${disabled ? styles.miniCardDisabled : ''}`}
                    data-red={isRed || undefined}
                    onClick={() => onToggle(card)}
                    disabled={disabled && !selected}
                    aria-label={`${card.rank} of ${card.suit}`}
                    aria-pressed={selected}
                  >
                    <span className={styles.miniRank}>{card.rank}</span>
                    <span className={styles.miniSuit}>{symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Done button when 5 cards selected */}
      {result && (
        <button className={styles.doneBtn} onClick={onClose}>
          Done
        </button>
      )}
    </div>
  );
}
