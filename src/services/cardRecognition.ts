import type { CardId } from '../types/card';
import { detectCards, preloadModel } from './cardDetection';

export { preloadModel };

/**
 * Recognize playing cards from a canvas element.
 * Uses YOLOv8 ONNX model running in the browser.
 */
export async function recognizeCards(canvas: HTMLCanvasElement): Promise<CardId[]> {
  const cards = await detectCards(canvas);

  if (cards.length === 0) {
    throw new Error('No cards detected. Make sure cards are clearly visible with good lighting.');
  }

  return cards;
}
