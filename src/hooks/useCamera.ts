import { useCallback, useEffect, useRef, useState } from 'react';

// Module-level stream so it persists across mount/unmount cycles.
// This avoids repeated camera permission prompts on iOS Safari.
let sharedStream: MediaStream | null = null;

// Hidden video element that keeps the stream "consumed" so iOS Safari
// doesn't kill the tracks when the scanner component unmounts.
let keepAliveEl: HTMLVideoElement | null = null;

function ensureKeepAlive(stream: MediaStream) {
  if (!keepAliveEl) {
    keepAliveEl = document.createElement('video');
    keepAliveEl.setAttribute('muted', '');
    keepAliveEl.setAttribute('playsinline', '');
    keepAliveEl.muted = true;
    keepAliveEl.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1';
    document.body.appendChild(keepAliveEl);
  }
  keepAliveEl.srcObject = stream;
  keepAliveEl.play().catch(() => {});
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

function isStreamActive(stream: MediaStream | null): boolean {
  if (!stream) return false;
  return stream.getTracks().some((t) => t.readyState === 'live');
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    // Only detach from the video element — don't kill the stream.
    // The keepAliveEl continues holding the stream so iOS won't kill it.
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      // Reuse existing stream if it's still active
      if (!isStreamActive(sharedStream)) {
        sharedStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        // Attach to hidden element so iOS doesn't kill it between scanner sessions
        ensureKeepAlive(sharedStream);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = sharedStream;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera.');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      // On unmount, just detach from the visible video — keepAliveEl holds the stream
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return { videoRef, error, start, stop };
}
