import { useCallback, useEffect, useRef, useState } from 'react';
import type { Card as CardType, CardId } from '../../types/card';
import { SUIT_SYMBOLS } from '../../types/card';
import type { EvaluationResult } from '../../types/evaluation';
import { HERO_NAMES } from '../../types/evaluation';
import { useCountUp } from '../../hooks/useCountUp';
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
  const displayMultiplier = useCountUp(scanState === 'result' ? (result?.multiplier ?? 0) : 0);

  useEffect(() => {
    start().catch(() => {}); // Error state handled inside the hook
    preloadModel(); // Start loading ONNX model while camera initializes
    return () => stop();
  }, [start, stop]);

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Ensure video is actually playing and has dimensions
    if (video.readyState < 2 || video.videoWidth === 0) {
      try {
        await video.play();
        // Wait for a frame to be decoded
        await new Promise((r) => requestAnimationFrame(r));
      } catch { /* ignore */ }
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

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
        <div
          className={styles.resultSection}
          data-tier={result?.multiplier ?? 0}
        >
          {/* Celebration effects for high multipliers */}
          {result && result.multiplier >= 2 && (
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

          {result && result.type !== 'no_valid_base' ? (
            <>
              {/* Big centered points value */}
              <div className={styles.pointsHero} data-tier={result.multiplier}>
                <span className={styles.pointsValue}>
                  {HERO_NAMES[result.type] || (() => {
                    const pts = (result.final2.reduce((s, c) => s + result.cardValues[c.id], 0)) % 10;
                    return pts === 0 ? '牛牛' : `牛${pts}`;
                  })()}
                </span>
              </div>

              {/* Multiplier meter — big, animated */}
              {(() => {
                const landed = displayMultiplier === result.multiplier;
                return (
                  <div
                    className={`${styles.multiplierMeter} ${landed ? styles.meterLanded : ''}`}
                    data-tier={landed ? result.multiplier : displayMultiplier}
                  >
                    <span className={styles.meterValue}>{displayMultiplier}x</span>
                    <span className={styles.meterLabel}>{landed ? result.label : ''}</span>
                  </div>
                );
              })()}

              {/* Card arrangement — single grid: final 2 top, base 3 bottom */}
              <div className={styles.arrangementGuide}>
                <span className={styles.guideTitle}>How to show your cards</span>
                <div className={styles.cardLayout}>
                  {result.type !== 'five_face_cards' ? (
                    <>
                      {/* Top row: Final 2 */}
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
                      {/* Bottom row: Base 3 */}
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
                        {selectedCards.map((c) => {
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
          ) : result && result.type === 'no_valid_base' ? (
            <>
              <div className={styles.pointsHero} data-tier={0}>
                <span className={styles.pointsValueMuted}>無牛</span>
              </div>
              <div className={`${styles.multiplierMeter} ${styles.meterLanded}`} data-tier={0}>
                <span className={styles.meterValue}>0x</span>
                <span className={styles.meterLabel}>{result.label}</span>
              </div>
              <div className={styles.arrangementGuide}>
                <span className={styles.guideHint}>
                  No 3-card combination sums to a multiple of 10
                </span>
              </div>
            </>
          ) : null}

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

export default CameraScanner;
