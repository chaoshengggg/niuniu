import type { Card as CardType } from '../../types/card';
import { SUIT_SYMBOLS } from '../../types/card';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  selected: boolean;
  disabled: boolean;
  onClick: (card: CardType) => void;
}

export function Card({ card, selected, disabled, onClick }: CardProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <button
      className={`${styles.card} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      data-red={isRed || undefined}
      onClick={() => onClick(card)}
      disabled={disabled && !selected}
      aria-label={`${card.rank} of ${card.suit}`}
      aria-pressed={selected}
    >
      <span className={styles.rank}>{card.rank}</span>
      <span className={styles.suit}>{symbol}</span>
    </button>
  );
}
