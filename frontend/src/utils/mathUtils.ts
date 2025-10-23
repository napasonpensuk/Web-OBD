export const clamp = (x: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, x));

export const scale = (v: number, lo: number, hi: number): number =>
  ((clamp(v, lo, hi) - lo) / (hi - lo)) * 100;

export const avg = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
