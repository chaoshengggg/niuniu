import * as ort from 'onnxruntime-web';
import type { CardId, Rank, Suit } from '../types/card';
import { RANKS, SUITS } from '../types/card';

// Use CDN for WASM files to avoid Vite bundling issues
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

const MODEL_PATH = '/model/best.onnx';
const MODEL_INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = 0.45;
const IOU_THRESHOLD = 0.5;

// YOLOv8 playing cards labels — alphabetically sorted, uppercase (52 classes)
// Matches the mustafakemal0146/playing-cards-yolov8 model from HuggingFace
const YOLO_LABELS: string[] = [
  '10C', '10D', '10H', '10S',
  '2C', '2D', '2H', '2S',
  '3C', '3D', '3H', '3S',
  '4C', '4D', '4H', '4S',
  '5C', '5D', '5H', '5S',
  '6C', '6D', '6H', '6S',
  '7C', '7D', '7H', '7S',
  '8C', '8D', '8H', '8S',
  '9C', '9D', '9H', '9S',
  'AC', 'AD', 'AH', 'AS',
  'JC', 'JD', 'JH', 'JS',
  'KC', 'KD', 'KH', 'KS',
  'QC', 'QD', 'QH', 'QS',
];

const SUIT_MAP: Record<string, Suit> = {
  C: 'clubs',
  D: 'diamonds',
  H: 'hearts',
  S: 'spades',
};

function labelToCardId(label: string): CardId | null {
  const suitChar = label.slice(-1).toUpperCase();
  const rankStr = label.slice(0, -1);

  const suit = SUIT_MAP[suitChar];
  if (!suit || !(SUITS as readonly string[]).includes(suit)) return null;

  // Normalize rank to match our type (A, 2-10, J, Q, K)
  const rank = rankStr.toUpperCase() === 'A' ? 'A'
    : rankStr.toUpperCase() === 'J' ? 'J'
    : rankStr.toUpperCase() === 'Q' ? 'Q'
    : rankStr.toUpperCase() === 'K' ? 'K'
    : rankStr;

  if (!(RANKS as readonly string[]).includes(rank)) return null;

  return `${rank as Rank}-${suit}` as CardId;
}

// Singleton model session
let sessionPromise: Promise<ort.InferenceSession> | null = null;

export function preloadModel(): void {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
    }).catch((err) => {
      // Reset so next attempt retries instead of returning the failed promise
      sessionPromise = null;
      throw err;
    });
    // Prevent unhandled rejection from crashing the page (e.g. on iOS Safari)
    sessionPromise.catch(() => {});
  }
}

async function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    preloadModel();
  }
  return sessionPromise!;
}

/**
 * Preprocess an image from a canvas for YOLOv8 input.
 * Resizes to 640x640, normalizes to [0,1], converts to NCHW format.
 */
function preprocessImage(canvas: HTMLCanvasElement): { tensor: ort.Tensor; xRatio: number; yRatio: number } {
  const offscreen = document.createElement('canvas');
  offscreen.width = MODEL_INPUT_SIZE;
  offscreen.height = MODEL_INPUT_SIZE;
  const ctx = offscreen.getContext('2d')!;

  // Resize image to model input size
  ctx.drawImage(canvas, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
  const pixels = imageData.data;

  // Convert to Float32 NCHW format, normalized to [0, 1]
  const numPixels = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const float32Data = new Float32Array(3 * numPixels);

  for (let i = 0; i < numPixels; i++) {
    const offset = i * 4;
    float32Data[i] = pixels[offset] / 255;                     // R channel
    float32Data[i + numPixels] = pixels[offset + 1] / 255;     // G channel
    float32Data[i + numPixels * 2] = pixels[offset + 2] / 255; // B channel
  }

  const tensor = new ort.Tensor('float32', float32Data, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

  return {
    tensor,
    xRatio: canvas.width / MODEL_INPUT_SIZE,
    yRatio: canvas.height / MODEL_INPUT_SIZE,
  };
}

interface Detection {
  classIndex: number;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Parse YOLOv8 output and apply NMS.
 * YOLOv8 output shape: [1, 4 + numClasses, numDetections]
 */
function postprocess(output: ort.Tensor): Detection[] {
  const data = output.data as Float32Array;
  const [, numRows, numDetections] = output.dims;
  const numClasses = numRows - 4;

  const detections: Detection[] = [];

  for (let i = 0; i < numDetections; i++) {
    // Extract box (cx, cy, w, h)
    const cx = data[0 * numDetections + i];
    const cy = data[1 * numDetections + i];
    const w = data[2 * numDetections + i];
    const h = data[3 * numDetections + i];

    // Find best class
    let maxScore = 0;
    let maxIndex = 0;
    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * numDetections + i];
      if (score > maxScore) {
        maxScore = score;
        maxIndex = c;
      }
    }

    if (maxScore < CONFIDENCE_THRESHOLD) continue;

    detections.push({
      classIndex: maxIndex,
      confidence: maxScore,
      x1: cx - w / 2,
      y1: cy - h / 2,
      x2: cx + w / 2,
      y2: cy + h / 2,
    });
  }

  // Apply NMS
  return nms(detections);
}

function iou(a: Detection, b: Detection): number {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);
  return intersection / (areaA + areaB - intersection);
}

function nms(detections: Detection[]): Detection[] {
  // Sort by confidence descending
  detections.sort((a, b) => b.confidence - a.confidence);

  const kept: Detection[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < detections.length; i++) {
    if (suppressed.has(i)) continue;
    kept.push(detections[i]);

    for (let j = i + 1; j < detections.length; j++) {
      if (suppressed.has(j)) continue;
      if (iou(detections[i], detections[j]) > IOU_THRESHOLD) {
        suppressed.add(j);
      }
    }
  }

  return kept;
}

/**
 * Detect playing cards in a canvas image.
 * Returns an array of CardIds found in the image.
 */
export async function detectCards(canvas: HTMLCanvasElement): Promise<CardId[]> {
  const session = await getSession();

  const { tensor } = preprocessImage(canvas);

  // Get the model's input name
  const inputName = session.inputNames[0];
  const results = await session.run({ [inputName]: tensor });

  // Get the model's output
  const outputName = session.outputNames[0];
  const output = results[outputName];

  const detections = postprocess(output);

  // Map detections to CardIds
  const cardIds: CardId[] = [];
  const seen = new Set<CardId>();

  for (const det of detections) {
    const label = YOLO_LABELS[det.classIndex];
    if (!label) continue;

    const cardId = labelToCardId(label);
    if (cardId && !seen.has(cardId)) {
      seen.add(cardId);
      cardIds.push(cardId);
    }
  }

  return cardIds;
}
