/**
 * Rate Limiting Filter for Zario
 * Prevents log flooding in high-throughput scenarios
 */

import { Filter } from './Filter.js';
import { LogData } from '../types/index.js';

export interface RateLimitFilterOptions {
  maxPerSecond?: number;
  burst?: number;
}

export class RateLimitFilter implements Filter {
  private maxPerSecond: number;
  private burst: number;
  private tokens: number;
  private lastRefill: number;

  constructor(options: RateLimitFilterOptions = {}) {
    this.maxPerSecond = options.maxPerSecond ?? 100;
    this.burst = options.burst ?? this.maxPerSecond * 2;
    this.tokens = this.burst;
    this.lastRefill = Date.now();
  }

  shouldEmit(logData: LogData): boolean {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.burst, this.tokens + elapsed * this.maxPerSecond);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}
