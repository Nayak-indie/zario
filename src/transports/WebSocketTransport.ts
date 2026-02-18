/**
 * WebSocket Transport for Zario
 * Real-time log streaming for monitoring dashboards
 */

import { Transport } from "./Transport.js";
import { LogData } from "../types/index.js";
import { Formatter } from "../core/Formatter.js";

export interface WebSocketTransportOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketTransport implements Transport {
  private url: string;
  private socket: any = null;
  private isConnected: boolean = false;

  constructor(options: WebSocketTransportOptions) {
    this.url = options.url;
    this.connect();
  }

  private connect(): void {
    import("ws").then((ws) => {
      try {
        this.socket = new ws.default(this.url);
        this.socket.on("open", () => { this.isConnected = true; });
        this.socket.on("close", () => { this.isConnected = false; });
        this.socket.on("error", (err: Error) => { console.error("[WebSocket]", err.message); });
      } catch (e) { console.error("[WebSocket] Failed to connect:", e); }
    }).catch(() => { /* ignore */ });
  }

  write(logData: LogData, _formatter: Formatter): void {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify(logData));
    }
  }
}
