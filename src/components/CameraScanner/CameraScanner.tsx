import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card as CardType, CardId } from '../../types/card';
import { SUIT_SYMBOLS } from '../../types/card';
import type { EvaluationResult } from '../../types/evaluation';
import { useCamera } from '../../hooks/useCamera';
import { recognizeCards, preloadModel } from '../../services/cardRecognition';
import styles from './CameraScanner.module.css';

type ScanState = 'live' | 'analyzing' | 'result' | 'error';

interface CameraScannerProps {
  deck: CardType[];
  selectedIds: Set<CardId>;
  onSelectCards: (ids: CardId[]) => void;
  onClear: () => void;
  onClose: () => void;
  result: EvaluationResult | null;
}

export function CameraScanner({
  deck,
  selectedIds,
  onSelectCards,
  onClear,
  onClose,
  result,
}: CameraScannerProps) {
  const { videoRef, error: cameraError, start, stop } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanState, setScanState] = useState<ScanState>('live');
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    start();
    preloadModel(); // Start loading ONNX model while camera initializes
    return () => stop();
  }, [start, stop]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Freeze frame onto canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setScanState('analyzing');
    setScanError(null);

    try {
      const cardIds = await recognizeCards(canvas);

      // Select the recognized cards (up to 5)
      onSelectCards(cardIds.slice(0, 5));
      setScanState('result');
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Recognition failed. Try again.');
      setScanState('error');
    }
  }, [videoRef, onSelectCards]);

  const handleRetake = useCallback(() => {
    setScanState('live');
    setScanError(null);
    onClear();
  }, [onClear]);

  const selectedCards = deck.filter((c) => selectedIds.has(c.id));
  const showFrozenFrame = scanState !== 'live';

  return (
    <div className={styles.overlay}>
      {/* Camera / captured image */}
      <div className={styles.cameraSection}>
        {cameraError ? (
          <div className={styles.cameraError}>
            <span className={styles.cameraErrorIcon}>📷</span>
            <span className={styles.cameraErrorText}>{cameraError}</span>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className={styles.video}
              autoPlay
              playsInline
              muted
              style={{ display: showFrozenFrame ? 'none' : 'block' }}
            />
            <canvas
              ref={canvasRef}
              className={styles.video}
              style={{ display: showFrozenFrame ? 'block' : 'none' }}
            />
          </>
        )}

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close scanner">
          ✕
        </button>

        {/* Capture button — live state */}
        {!cameraError && scanState === 'live' && (
          <button className={styles.captureBtn} onClick={handleCapture} aria-label="Capture photo">
            <span className={styles.captureBtnInner} />
          </button>
        )}

        {/* Analyzing overlay */}
        {scanState === 'analyzing' && (
          <div className={styles.analyzingOverlay}>
            <div className={styles.spinner} />
            <span className={styles.analyzingText}>Identifying cards...</span>
          </div>
        )}

        {/* Retake button — result or error state */}
        {(scanState === 'result' || scanState === 'error') && (
          <button className={styles.retakeBtn} onClick={handleRetake}>
            Retake
          </button>
        )}
      </div>

      {/* Result section */}
      {scanState === 'result' && (
        <div className={styles.resultSection}>
          {/* Recognized cards */}
          <div className={styles.recognizedCards}>
            <span className={styles.recognizedLabel}>Cards found:</span>
            <div className={styles.chipList}>
              {selectedCards.map((c) => {
                const isRed = c.suit === 'hearts' || c.suit === 'diamonds';
                return (
                  <span
                    key={c.id}
                    className={styles.chip}
                    data-red={isRed || undefined}
                  >
                    {c.rank}{SUIT_SYMBOLS[c.suit]}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Evaluation result */}
          {result && (
            <div className={styles.evalResult}>
              <span className={styles.resultBadge}>
                {result.multiplier}x
              </span>
              <span className={styles.resultLabel}>{result.label}</span>
            </div>
          )}

          {selectedIds.size > 0 && selectedIds.size < 5 && (
            <div className={styles.warningText}>
              Only {selectedIds.size} card{selectedIds.size !== 1 ? 's' : ''} detected. Try again with all 5 cards visible.
            </div>
          )}

          <button className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      )}

      {/* Error section */}
      {scanState === 'error' && (
        <div className={styles.resultSection}>
          <div className={styles.errorMessage}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorText}>{scanError}</span>
          </div>
          <button className={styles.retryBtn} onClick={handleRetake}>
            Try Again
          </button>
        </div>
      )}

      {/* Hint text — live state */}
      {scanState === 'live' && !cameraError && (
        <div className={styles.hintSection}>
          <span className={styles.hintText}>
            Point your camera at your cards, then tap the capture button
          </span>
        </div>
      )}
    </div>
  );
}
