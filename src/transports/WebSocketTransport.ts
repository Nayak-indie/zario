/**
 * WebSocket Transport for Zario
 * Real-time log streaming for monitoring dashboards
 */

import { Transport, TransportOptions } from './Transport.js';
import { LogData } from '../types/index.js';
import { Formatter } from '../core/Formatter.js';

export interface WebSocketTransportOptions extends TransportOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketTransport extends Transport {
  private url: string;
  private socket: any = null;
  private isConnected: boolean = false;

  constructor(options: WebSocketTransportOptions) {
    super(options);
    this.url = options.url;
    this.connect();
  }

  private connect(): void {
    try {
      // Use dynamic import for ws
      import('ws').then((ws) => {
        this.socket = new ws.default(this.url);
        this.socket.on('open', () => { this.isConnected = true; });
        this.socket.on('close', () => { this.isConnected = false; });
        this.socket.on('error', (err: Error) => { console.error('[WebSocket]', err.message); });
      }).catch((e) => { console.error('[WebSocket] Failed to connect:', e); });
    } catch (e) { console.error('[WebSocket] Failed to connect:', e); }
  }

  write(logData: LogData, _formatter: Formatter): void {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(logData));
    }
  }

  close(): void {
    if (this.socket) { this.socket.close(); this.socket = null; }
  }
}
