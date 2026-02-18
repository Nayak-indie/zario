/**
 * Circular Reference Safe Stringify
 * Handles circular objects in metadata gracefully
 */

import { getType } from '../utils/index.js';

/**
 * Safely stringify an object, handling circular references
 * 
 * @example
 * import { safeStringify } from "zario/utils";
 * 
 * const obj = { name: "test" };
 * obj.self = obj; // Circular!
 * 
 * const json = safeStringify(obj);
 * // Output: {"name":"test","self":"[Circular]"}
 */
export function safeStringify(obj: any, space?: string | number): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Handle undefined
    if (value === undefined) {
      return undefined;
    }
    
    // Handle functions
    if (typeof value === 'function') {
      return `[Function: ${value.name || 'anonymous'}]`;
    }
    
    // Handle symbols
    if (typeof value === 'symbol') {
      return value.toString();
    }
    
    // Handle BigInt
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    
    return value;
  }, space);
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch (error: any) {
    return {
      _parseError: true,
      message: error.message,
      raw: json
    };
  }
}

/**
 * Get type of value as string
 */
function getType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Create a safe clone of an object, removing circular refs
 */
export function safeClone<T>(obj: T): T {
  return safeJsonParse(safeStringify(obj));
}

export default { safeStringify, safeJsonParse, safeClone };
