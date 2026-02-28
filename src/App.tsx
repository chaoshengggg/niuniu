import { useCallback, useMemo, useState } from 'react';
import type { Card, CardId } from './types/card';
import { createDeck } from './utils/deck';
import { useEvaluation } from './hooks/useEvaluation';
import { Header } from './components/Header/Header';
import { ResultDisplay } from './components/ResultDisplay/ResultDisplay';
import { CardSelector } from './components/CardSelector/CardSelector';
import { CameraScanner } from './components/CameraScanner/CameraScanner';
import styles from './App.module.css';

function App() {
  const deck = useMemo(() => createDeck(), []);
  const [selectedIds, setSelectedIds] = useState<Set<CardId>>(new Set());
  const [scannerOpen, setScannerOpen] = useState(false);
  const result = useEvaluation(selectedIds, deck);

  const handleToggle = useCallback((card: Card) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
      } else if (next.size < 5) {
        next.add(card.id);
      }
      return next;
    });
  }, []);

  const handleClear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleOpenScanner = useCallback(() => {
    setScannerOpen(true);
  }, []);

  const handleCloseScanner = useCallback(() => {
    setScannerOpen(false);
  }, []);

  return (
    <div className={styles.app}>
      <Header />
      <ResultDisplay result={result} selectedCount={selectedIds.size} />
      <CardSelector
        deck={deck}
        selectedIds={selectedIds}
        onToggle={handleToggle}
        onClear={handleClear}
        onScan={handleOpenScanner}
      />
      {scannerOpen && (
        <CameraScanner
          deck={deck}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          onClear={handleClear}
          onClose={handleCloseScanner}
          result={result}
        />
      )}
    </div>
  );
}

export default App;
