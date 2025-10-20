/**
 * Utility functions for generating random values
 */

/**
 * Generate a random UUID v4
 */
export function getRandomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a random number between min and max with specified decimal places
 */
export function getRandomBetween(min = 0, max = 1, digits = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(digits));
}

/**
 * Generate a random hex color
 */
export function getRandomHexColor(): string {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return '#' + randomColor.padStart(6, '0');
}

/**
 * Generate a random boolean with optional probability
 */
export function getRandomBoolean(trueProbability = 0.5): boolean {
  return Math.random() < trueProbability;
}

/**
 * Generate a random number string of specified length
 */
export function randomNumber(length: number): string {
  return Math.random().toString().slice(2, length + 2);
}

/**
 * Generate a DNA-like string identifier
 */
export function genDNA(x = 12, y = 12, z = 12): string {
  const X = randomNumber(x);
  const Y = randomNumber(y);
  const Z = randomNumber(z);
  return `${X}-${Y}-${Z}`;
}
