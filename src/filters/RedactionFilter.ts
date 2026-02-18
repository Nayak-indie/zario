/**
 * Redaction Filter for Zario
 * Auto-redact PII (emails, phones, credit cards) from logs
 */

import { Filter } from './Filter.js';
import { LogData } from '../types/index.js';

export interface RedactionFilterOptions {
  patterns?: RegExp[];
  replacement?: string;
  redactEmails?: boolean;
  redactPhones?: boolean;
  redactCreditCards?: boolean;
}

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g;

export class RedactionFilter implements Filter {
  private patterns: RegExp[];
  private replacement: string;

  constructor(options: RedactionFilterOptions = {}) {
    this.replacement = options.replacement ?? '[REDACTED]';
    this.patterns = options.patterns ?? [];
    
    if (options.redactEmails !== false) this.patterns.push(EMAIL_REGEX);
    if (options.redactPhones !== false) this.patterns.push(PHONE_REGEX);
    if (options.redactCreditCards !== false) this.patterns.push(CREDIT_CARD_REGEX);
  }

  shouldEmit(logData: LogData): boolean {
    if (logData.message) {
      for (const pattern of this.patterns) {
        logData.message = logData.message.replace(pattern, this.replacement);
      }
    }
    return true;
  }
}
