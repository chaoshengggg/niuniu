import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { Card, CardId } from './types/card';
import { createDeck } from './utils/deck';
import { useEvaluation } from './hooks/useEvaluation';
import { Header } from './components/Header/Header';
import { ResultDisplay } from './components/ResultDisplay/ResultDisplay';
import { CardSelector } from './components/CardSelector/CardSelector';
import styles from './App.module.css';

// Lazy-load CameraScanner so onnxruntime-web (25MB WASM) only loads when scanner opens.
// This prevents memory pressure on iOS Safari which can cause page refreshes.
const CameraScanner = lazy(() => import('./components/CameraScanner/CameraScanner'));

function App() {
  const deck = useMemo(() => createDeck(), []);
  const [selectedIds, setSelectedIds] = useState<Set<CardId>>(new Set());
  const [scannerOpen, setScannerOpen] = useState(false);
  const result = useEvaluation(selectedIds, deck);

  // Catch unhandled promise rejections to prevent iOS Safari page crashes
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      console.warn('Unhandled rejection caught:', e.reason);
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

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

  const handleSelectCards = useCallback((ids: CardId[]) => {
    setSelectedIds(new Set(ids));
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
        <Suspense fallback={null}>
          <CameraScanner
            deck={deck}
            selectedIds={selectedIds}
            onSelectCards={handleSelectCards}
            onClear={handleClear}
            onClose={handleCloseScanner}
            result={result}
          />
        </Suspense>
      )}
    </div>
  );
}

export default App;
