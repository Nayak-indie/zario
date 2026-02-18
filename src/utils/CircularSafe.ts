/**
 * Circular Reference Safe Stringify
 * Handles circular references, BigInt, Symbols, Functions
 */

export function safeStringify(obj: any, space?: string | number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'bigint') return value.toString() + 'n';
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  }, space);
}

export function safeJsonParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch (error: any) {
    return { _parseError: true, message: error.message, raw: json };
  }
}

export function safeClone<T>(obj: T): T {
  return safeJsonParse(safeStringify(obj));
}

export default { safeStringify, safeJsonParse, safeClone };
