/**
 * Syslog Transport for Zario
 * Native syslog support for Unix/Linux systems (RFC 5424)
 */

import { Transport, TransportOptions } from './Transport.js';
import { LogData } from '../types/index.js';
import { Formatter } from '../core/Formatter.js';

export interface SyslogTransportOptions extends TransportOptions {
  /** Syslog facility (default: local0) */
  facility?: 'kern' | 'user' | 'mail' | 'daemon' | 'auth' | 'syslog' | 'lpr' | 'news' | 'uucp' | 'cron' | 'authpriv' | 'ftp' | 'local0' | 'local1' | 'local2' | 'local3' | 'local4' | 'local5' | 'local6' | 'local7';
  /** Application name (default: zario) */
  appName?: string;
  /** Syslog host (default: localhost) */
  host?: string;
  /** Syslog port (default: 514) */
  port?: number;
  /** Use UDP (default: true) or TCP */
  useUDP?: boolean;
  /** Include hostname in message */
  includeHostname?: boolean;
  /** TLS/SSL for TCP connections */
  tls?: boolean;
}

const FACILITY_CODES: Record<string, number> = {
  kern: 0, user: 1, mail: 2, daemon: 3, auth: 4, syslog: 5, lpr: 6, news: 7,
  uucp: 8, cron: 9, authpriv: 10, ftp: 11, local0: 16, local1: 17, local2: 18,
  local3: 19, local4: 20, local5: 21, local6: 22, local7: 23
};

const SYSLOG_LEVELS: Record<string, number> = {
  debug: 7, info: 6, notice: 5, warn: 4, error: 3, critical: 2, alert: 1, fatal: 0
};

export class SyslogTransport extends Transport {
  private facility: number;
  private appName: string;
  private host: string;
  private port: number;
  private useUDP: boolean;
  private socket: any = null;
  private includeHostname: boolean;
  private hostname: string;

  constructor(options: SyslogTransportOptions = {}) {
    super(options);
    this.facility = FACILITY_CODES[options.facility ?? 'local0'];
    this.appName = options.appName ?? 'zario';
    this.host = options.host ?? 'localhost';
    this.port = options.port ?? 514;
    this.useUDP = options.useUDP ?? true;
    this.includeHostname = options.includeHostname ?? true;
    this.hostname = require('os').hostname();
    
    this.initializeSocket();
  }

  private initializeSocket(): void {
    if (this.useUDP) {
      const dgram = require('dgram');
      this.socket = dgram.createSocket('udp4');
    }
  }

  private createSyslogMessage(level: string, message: string, timestamp: Date): string {
    const pri = (this.facility * 8) + (SYSLOG_LEVELS[level] ?? 6);
    const timestampStr = timestamp.toISOString();
    const hostname = this.includeHostname ? this.hostname : '-';
    
    // RFC 5424 format
    const msg = `<${pri}>1 ${timestampStr} ${hostname} ${this.appName} - - ${message}`;
    return msg;
  }

  write(logData: LogData, formatter: Formatter): void {
    const formatted = formatter.format(logData);
    const syslogMsg = this.createSyslogMessage(logData.level, formatted.message, logData.timestamp);
    
    const buffer = Buffer.from(syslogMsg, 'utf8');
    
    if (this.useUDP && this.socket) {
      this.socket.send(buffer, 0, buffer.length, this.port, this.host, (err) => {
        if (err) {
          console.error('[SyslogTransport] Send error:', err);
        }
      });
    }
  }

  async writeAsync?(logData: LogData, formatter: Formatter): Promise<void> {
    return new Promise((resolve, reject) => {
      const formatted = formatter.format(logData);
      const syslogMsg = this.createSyslogMessage(logData.level, formatted.message, logData.timestamp);
      
      const buffer = Buffer.from(syslogMsg, 'utf8');
      
      if (this.useUDP && this.socket) {
        this.socket.send(buffer, 0, buffer.length, this.port, this.host, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
