/**
 * Rate Limiting Filter for Zario
 * Prevents log flooding in high-throughput scenarios
 */

import { Filter, FilterResult } from './Filter.js';
import { LogData } from '../types/index.js';

export interface RateLimitFilterOptions {
  /** Maximum log entries per second (default: 100) */
  maxPerSecond?: number;
  /** Burst allowance (default: maxPerSecond * 2) */
  burst?: number;
  /** Log level to apply rate limiting (default: all) */
  level?: string;
  /** Callback when logs are dropped */
  onDrop?: (logData: LogData, droppedCount: number) => void;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimitFilter implements Filter {
  private maxPerSecond: number;
  private burst: number;
  private level?: string;
  private onDrop?: (logData: LogData, droppedCount: number) => void;
  private buckets: Map<string, TokenBucket> = new Map();
  private dropCounts: Map<string, number> = new Map();

  constructor(options: RateLimitFilterOptions = {}) {
    this.maxPerSecond = options.maxPerSecond ?? 100;
    this.burst = options.burst ?? this.maxPerSecond * 2;
    this.level = options.level;
    this.onDrop = options.onDrop;
  }

  shouldEmit(logData: LogData): FilterResult {
    // If level is specified and doesn't match, allow
    if (this.level && logData.level !== this.level) {
      return FilterResult.PASS;
    }

    const key = logData.level;
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.burst,
        lastRefill: Date.now()
      };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.maxPerSecond;
    
    bucket.tokens = Math.min(this.burst, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we have tokens available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return FilterResult.PASS;
    }

    // Track drops
    const currentDrops = this.dropCounts.get(key) || 0;
    this.dropCounts.set(key, currentDrops + 1);

    // Call drop callback if provided
    if (this.onDrop) {
      this.onDrop(logData, currentDrops + 1);
    }

    return FilterResult.DROP;
  }

  /** Get current drop counts */
  getDropCounts(): Record<string, number> {
    return Object.fromEntries(this.dropCounts);
  }

  /** Reset drop counts */
  resetDropCounts(): void {
    this.dropCounts.clear();
  }
}
