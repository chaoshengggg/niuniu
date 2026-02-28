# 🐂 Custom Niu Niu (牛牛) – Game Rules Specification

## 1. Base Game

This game is based on Niu Niu (Bull Bull) with custom house rules.

- Standard 52-card deck
- 5 cards per player
- No jokers

---

# 2. Card System

## 2.1 Card Identity (Raw Rank)

Raw rank is used for:

- Pair detection
- Face card detection
- Ace of Spades detection

Ranks:

- A, 2–10, J, Q, K

Ace is always treated as rank A (never 11).

---

## 2.2 Transformed Value (Used for Calculations Only)

Before evaluating a hand, transform card values as follows:

| Raw Rank | Transformed Value |
| -------- | ----------------- |
| A        | 1                 |
| 2        | 2                 |
| 3        | 6                 |
| 4        | 4                 |
| 5        | 5                 |
| 6        | 3                 |
| 7        | 7                 |
| 8        | 8                 |
| 9        | 9                 |
| 10       | 10                |
| J        | 10                |
| Q        | 10                |
| K        | 10                |

### Important Rules

- 3 and 6 swap values.
- This swap affects only numerical calculation.
- Card rank does NOT change.
- Pair detection must use raw rank, NOT transformed value.

---

# 3. Hand Evaluation Flow

## Step 1 — Five Face Card Override (7x)

If all 5 cards are:

- J, Q, or K

Then:

- Payout = 7x
- Stop evaluation immediately.

---

## Step 2 — Valid Base Requirement (Mandatory)

A valid hand must contain:

- Any 3 cards whose transformed values sum to a multiple of 10.

If no such combination exists:

- Payout = 0
- Stop evaluation.

If multiple valid 3-card combinations exist:

- All must be evaluated.
- The system must select the combination that produces the highest payout.

---

## Step 3 — Final 2 Cards

For each valid 3-card base:

- The remaining 2 cards are considered the "final 2".

All payout rules below apply only to the final 2 cards.

---

# 4. Payout Rules (Final 2 Only)

Only evaluate payout rules if a valid base exists.

If multiple payout conditions apply:

- Use the highest multiplier only.
- No stacking.
- No addition.
- No multiplication of multipliers.

---

## 4.1 Pair (3x)

If the final 2 cards share identical raw rank:

Valid Examples:

- 7 + 7
- K + K
- 3 + 3
- 6 + 6

Invalid Example:

- 3 + 6 (even though transformed values swap)

Pair detection must use raw rank only.

Payout = 3x

---

## 4.2 Final 2 Sum to 10 (2x)

If the transformed values of the final 2 sum exactly to 10.

Examples:

- 4 + 6
- 5 + 5
- 9 + A

Payout = 2x

---

## 4.3 Face Card + Ace of Spades (5x)

If the final 2 consist of:

- One J, Q, or K
  AND
- One Ace of Spades (A♠ exactly)

Suit matters.

Valid Examples:

- K♣ + A♠
- Q♦ + A♠

Invalid Examples:

- J♠ + A♥
- A♠ + 10

Payout = 5x

---

# 5. Multiplier Resolution

If multiple payout conditions apply:

Example:

- Final 2 = 5 + 5
  - Pair (3x)
  - Sum 10 (2x)

Result:

- Highest multiplier only.
- Final payout = 3x.

No stacking allowed.

---

# 6. Best Combination Requirement

If multiple valid 3-card base combinations exist:

The system must:

1. Evaluate every valid base.
2. Compute payout for each corresponding final 2.
3. Return the highest possible multiplier.

Players do not manually choose the base.
The system automatically selects the optimal payout outcome.

---

# 7. Multiplier Summary

| Condition                      | Multiplier |
| ------------------------------ | ---------- |
| Five Face Cards                | 7x         |
| Face + Ace of Spades (final 2) | 5x         |
| Pair (final 2)                 | 3x         |
| Final 2 sum to 10              | 2x         |
| No valid base                  | 0          |

---

# 8. Implementation Requirements

- Always apply the 3 ↔ 6 transformation before calculations.
- Keep raw rank and transformed value separate.
- Always evaluate all possible base combinations.
- Always return the highest possible multiplier.
- Never allow multiplier stacking.
