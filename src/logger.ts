import { Logger } from "./core/Logger.js";

export { Logger } from "./core/Logger.js";
export type { LoggerOptions, LoggerRetryOptions, RetryTransportFactory } from "./core/Logger.js";
export type { LogLevel } from "./core/LogLevel.js";

// Additional exports for slim entrypoint
export { ConsoleTransport } from "./transports/ConsoleTransport.js";
export { Transport } from "./transports/Transport.js";
export type { TransportConfig } from "./types/index.js";

export default Logger;
