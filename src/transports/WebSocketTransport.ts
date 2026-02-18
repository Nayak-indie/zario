/**
 * WebSocket Transport for Zario
 * Real-time log streaming for monitoring dashboards
 */

import { Transport, TransportOptions } from './Transport.js';
import { LogData } from '../types/index.js';
import { Formatter } from '../core/Formatter.js';

export interface WebSocketTransportOptions extends TransportOptions {
  /** WebSocket server URL */
  url: string;
  /** Reconnection interval in ms (default: 5000) */
  reconnectInterval?: number;
  /** Maximum reconnection attempts (default: 10) */
  maxReconnectAttempts?: number;
  /** Send interval for batching (default: 1000ms) */
  batchInterval?: number;
  /** Enable JSON compression */
  compress?: boolean;
  /** Custom headers for WebSocket connection */
  headers?: Record<string, string>;
}

export class WebSocketTransport extends Transport {
  private url: string;
  private socket: any = null;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private batchInterval: number;
  private compress: boolean;
  private headers: Record<string, string>;
  private reconnectAttempts: number = 0;
  private messageQueue: LogData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  constructor(options: WebSocketTransportOptions) {
    super(options);
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval ?? 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;
    this.batchInterval = options.batchInterval ?? 1000;
    this.compress = options.compress ?? false;
    this.headers = options.headers ?? {};
    
    this.connect();
  }

  private connect(): void {
    try {
      // Use native WebSocket if available, otherwise require ws
      let WebSocketClient: any;
      try {
        WebSocketClient = globalThis.WebSocket || require('ws');
      } catch {
        WebSocketClient = require('ws');
      }
      
      this.socket = new WebSocketClient(this.url, { headers: this.headers });
      
      this.socket.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.flushQueue();
        this.startBatching();
      });
      
      this.socket.on('close', () => {
        this.isConnected = false;
        this.stopBatching();
        this.attemptReconnect();
      });
      
      this.socket.on('error', (error) => {
        console.error('[WebSocketTransport] Error:', error.message);
      });
      
      this.socket.on('message', (data) => {
        // Handle incoming messages if needed
      });
    } catch (error) {
      console.error('[WebSocketTransport] Connection error:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  private startBatching(): void {
    if (this.batchTimer) return;
    this.batchTimer = setInterval(() => {
      if (this.messageQueue.length > 0) {
        this.flushQueue();
      }
    }, this.batchInterval);
  }

  private stopBatching(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  private flushQueue(): void {
    if (!this.isConnected || this.messageQueue.length === 0) return;
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    const payload = this.compress 
      ? JSON.stringify(messages)
      : JSON.stringify(messages);
    
    this.socket.send(payload);
  }

  write(logData: LogData, formatter: Formatter): void {
    this.messageQueue.push(logData);
    
    if (!this.batchTimer || this.messageQueue.length === 1) {
      this.flushQueue();
    }
  }

  async writeAsync?(logData: LogData, formatter: Formatter): Promise<void> {
    this.write(logData, formatter);
  }

  close(): void {
    this.stopBatching();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }
}
