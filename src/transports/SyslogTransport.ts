/**
 * Syslog Transport for Zario
 * Native syslog support for Unix/Linux systems (RFC 5424)
 */

import { Transport, TransportOptions } from './Transport.js';
import { LogData } from '../types/index.js';
import { Formatter } from '../core/Formatter.js';

export interface SyslogTransportOptions extends TransportOptions {
  facility?: 'kern' | 'user' | 'mail' | 'daemon' | 'auth' | 'syslog' | 'lpr' | 'news' | 'uucp' | 'cron' | 'authpriv' | 'ftp' | 'local0' | 'local1' | 'local2' | 'local3' | 'local4' | 'local5' | 'local6' | 'local7';
  appName?: string;
  host?: string;
  port?: number;
  useUDP?: boolean;
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
  private socket: any = null;
  private hostname: string;

  constructor(options: SyslogTransportOptions = {}) {
    super(options);
    this.facility = FACILITY_CODES[options.facility ?? 'local0'];
    this.appName = options.appName ?? 'zario';
    this.host = options.host ?? 'localhost';
    this.port = options.port ?? 514;
    this.useUDP = options.useUDP ?? true;
    this.hostname = require('os').hostname();
  }

  write(logData: LogData, formatter: Formatter): void {
    const formatted = formatter.format(logData);
    const pri = (this.facility * 8) + (SYSLOG_LEVELS[logData.level] ?? 6);
    const msg = `<${pri}>1 ${logData.timestamp.toISOString()} ${this.hostname} ${this.appName} - - ${formatted.message}`;
    const buffer = Buffer.from(msg, 'utf8');
    
    if (this.useUDP) {
      const dgram = require('dgram');
      const sock = dgram.createSocket('udp4');
      sock.send(buffer, 0, buffer.length, this.port, this.host);
      sock.close();
    }
  }

  close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
