import { useCallback, useEffect, useRef, useState } from 'react';

// Module-level stream so it persists across mount/unmount cycles.
// This avoids repeated camera permission prompts on iOS Safari.
let sharedStream: MediaStream | null = null;

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
    // The stream stays alive so we can reuse it without re-prompting.
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
      // On unmount, just detach — don't stop the stream
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return { videoRef, error, start, stop };
}
