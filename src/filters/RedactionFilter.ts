/**
 * Redaction Filter for Zario
 * Auto-redact PII (emails, phones, credit cards) from logs
 */

import { Filter, FilterResult } from './Filter.js';
import { LogData } from '../types/index.js';

export interface RedactionFilterOptions {
  /** Regex patterns to redact */
  patterns?: RegExp[];
  /** Replacement string (default: '[REDACTED]') */
  replacement?: string;
  /** Redact email addresses (default: true) */
  redactEmails?: boolean;
  /** Redact phone numbers (default: true) */
  redactPhones?: boolean;
  /** Redact credit card numbers (default: true) */
  redactCreditCards?: boolean;
  /** Redact SSN (default: true) */
  redactSSN?: boolean;
  /** Redact IP addresses (default: false) */
  redactIPs?: boolean;
  /** Custom field names to redact */
  customFields?: string[];
}

// Default patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /\b(\+?1?[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
const SSN_REGEX = /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g;
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

export class RedactionFilter implements Filter {
  private patterns: RegExp[];
  private replacement: string;
  private customFields: string[];

  constructor(options: RedactionFilterOptions = {}) {
    this.replacement = options.replacement ?? '[REDACTED]';
    this.customFields = options.customFields ?? [];
    
    // Build patterns list
    this.patterns = options.patterns ?? [];
    
    if (options.redactEmails !== false) {
      this.patterns.push(EMAIL_REGEX);
    }
    if (options.redactPhones !== false) {
      this.patterns.push(PHONE_REGEX);
    }
    if (options.redactCreditCards !== false) {
      this.patterns.push(CREDIT_CARD_REGEX);
    }
    if (options.redactSSN !== false) {
      this.patterns.push(SSN_REGEX);
    }
    if (options.redactIPs === true) {
      this.patterns.push(IP_REGEX);
    }
  }

  shouldEmit(logData: LogData): FilterResult {
    // Redact message
    if (logData.message) {
      logData.message = this.redactText(logData.message);
    }
    
    // Redact metadata fields
    if (logData.metadata) {
      logData.metadata = this.redactObject(logData.metadata);
    }
    
    // Redact prefix
    if (logData.prefix) {
      logData.prefix = this.redactText(logData.prefix);
    }
    
    return FilterResult.PASS;
  }

  private redactText(text: string): string {
    let result = text;
    for (const pattern of this.patterns) {
      result = result.replace(pattern, this.replacement);
    }
    return result;
  }

  private redactObject(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if this field should be fully redacted
      if (this.customFields.includes(key.toLowerCase())) {
        result[key] = this.replacement;
      } else if (typeof value === 'string') {
        result[key] = this.redactText(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.redactObject(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}
