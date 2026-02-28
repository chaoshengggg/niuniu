import type { Card as CardType } from '../../types/card';
import { SUITS, SUIT_SYMBOLS } from '../../types/card';
import type { CardId } from '../../types/card';
import { Card } from '../Card/Card';
import styles from './CardSelector.module.css';

interface CardSelectorProps {
  deck: CardType[];
  selectedIds: Set<CardId>;
  onToggle: (card: CardType) => void;
  onClear: () => void;
  onScan: () => void;
}

export function CardSelector({ deck, selectedIds, onToggle, onClear, onScan }: CardSelectorProps) {
  const maxSelected = selectedIds.size >= 5;

  const suitGroups = SUITS.map((suit) => ({
    suit,
    symbol: SUIT_SYMBOLS[suit],
    cards: deck.filter((c) => c.suit === suit),
  }));

  return (
    <section className={styles.selector}>
      <div className={styles.toolbar}>
        <span className={styles.counter}>
          <span className={styles.count}>{selectedIds.size}</span>
          <span className={styles.countDivider}>/</span>
          <span className={styles.countTotal}>5</span>
        </span>
        <div className={styles.toolbarActions}>
          <button className={styles.scanBtn} onClick={onScan}>
            📷 Scan
          </button>
          {selectedIds.size > 0 && (
            <button className={styles.clearBtn} onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className={styles.suitGroups}>
        {suitGroups.map(({ suit, symbol, cards }) => (
          <div key={suit} className={styles.suitGroup}>
            <div
              className={styles.suitLabel}
              data-red={suit === 'hearts' || suit === 'diamonds' || undefined}
            >
              {symbol}
            </div>
            <div className={styles.cardRow}>
              {cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  selected={selectedIds.has(card.id)}
                  disabled={maxSelected && !selectedIds.has(card.id)}
                  onClick={onToggle}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
