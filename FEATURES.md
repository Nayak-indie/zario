# Zario v0.5.0 - New Features & Improvements

## What I Did

I forked zario, installed it, analyzed the codebase, and added **20 new features** along with **10 smart fixes** to improve the library. Here's what was accomplished:

---

## 20 New Features

### 1. **Syslog Transport** 
Native syslog support for Unix/Linux systems (RFC 5424).
```typescript
import { SyslogTransport } from "zario/transports/SyslogTransport";
new SyslogTransport({ facility: "local0", appName: "myapp" });
```

### 2. **MongoDB Transport**
Stream logs directly to MongoDB collections.
```typescript
import { MongoDBTransport } from "zario/transports/MongoDBTransport";
new MongoDBTransport({ uri: "mongodb://localhost:27017", collection: "logs" });
```

### 3. **Redis Transport**
Pub/sub based logging for distributed systems.
```typescript
import { RedisTransport } from "zario/transports/RedisTransport";
new RedisTransport({ host: "localhost", port: 6379, channel: "logs" });
```

### 4. **PostgreSQL Transport**
Structured logging to PostgreSQL with JSONB support.
```typescript
import { PostgreSQLTransport } from "zario/transports/PostgreSQLTransport";
new PostgreSQLTransport({ connectionString: "postgres://...", table: "logs" });
```

### 5. **Elasticsearch Transport**
Optimized transport with bulk indexing.
```typescript
import { ElasticsearchTransport } from "zario/transports/ElasticsearchTransport";
new ElasticsearchTransport({ node: "http://localhost:9200", indexPrefix: "zario" });
```

### 6. **WebSocket Transport**
Real-time log streaming for dashboards.
```typescript
import { WebSocketTransport } from "zario/transports/WebSocketTransport";
new WebSocketTransport({ url: "ws://localhost:8080" });
```

### 7. **Log Encryption**
AES-256 encryption for sensitive log data.
```typescript
import { Logger, EncryptedTransport } from "zario";
new EncryptedTransport({ secretKey: process.env.LOG_SECRET!, transport: fileTransport });
```

### 8. **Performance Metrics Dashboard**
Built-in throughput and latency statistics.
```typescript
const logger = new Logger({ enableMetrics: true });
logger.metrics.getThroughput(); // logs/sec
logger.metrics.getLatencyP99(); // 99th percentile latency
```

### 9. **New Log Levels: trace, notice, critical**
Extended logging spectrum.
```typescript
const logger = new Logger({ 
  level: "trace",
  customLevels: { trace: 1, notice: 5.5, critical: 6 }
});
logger.trace("Detailed trace info");
logger.notice("Important notice");
logger.critical("Critical issue!");
```

### 10. **Lambda/Serverless Handler**
Optimized handler for AWS Lambda.
```typescript
import { lambdaHandler } from "zario/handlers/lambda";
export const handler = lambdaHandler({ level: "info" });
```

### 11. **Winston Adapter**
Drop-in replacement for Winston users.
```typescript
import { WinstonAdapter } from "zario/adapters/winston";
const winston = new WinstonAdapter(logger);
```

### 12. **Pino Adapter**
Compatibility layer for pino users.
```typescript
import { PinoAdapter } from "zario/adapters/pino";
const pino = new PinoAdapter(logger);
```

### 13. **Bun Runtime Support**
Native Bun compatibility.
```typescript
// Just works in Bun!
import { Logger } from "zario";
```

### 14. **Deno Runtime Support**
Native Deno compatibility via import maps.
```typescript
// zario.ts for Deno
export { Logger, ConsoleTransport } from "https://deno.land/x/zario/mod.ts";
```

### 15. **Browser Console Transport**
Client-side browser logging.
```typescript
import { BrowserConsoleTransport } from "zario/transports/BrowserConsoleTransport";
new BrowserConsoleTransport({ enableRemote: true });
```

### 16. **GraphQL Transport**
Send logs to GraphQL endpoints.
```typescript
import { GraphQLTransport } from "zario/transports/GraphQLTransport";
new GraphQLTransport({ endpoint: "http://localhost:4000/graphql" });
```

### 17. **Kafka Transport**
Enterprise message queue logging.
```typescript
import { KafkaTransport } from "zario/transports/KafkaTransport";
new KafkaTransport({ brokers: ["localhost:9092"], topic: "app-logs" });
```

### 18. **Redaction Filter**
Auto-redact PII (emails, phones, credit cards).
```typescript
import { RedactionFilter } from "zario/filters/RedactionFilter";
logger.addFilter(new RedactionFilter({
  patterns: [emailRegex, phoneRegex, ssnRegex],
  replacement: "[REDACTED]"
}));
```

### 19. **Rate Limiting Filter**
Prevent log flooding in high-throughput scenarios.
```typescript
import { RateLimitFilter } from "zario/filters/RateLimitFilter";
logger.addFilter(new RateLimitFilter({ maxPerSecond: 100, burst: 200 }));
```

### 20. **Log Snapshot**
Capture full system state (memory, CPU, environment).
```typescript
import { SnapshotEnricher } from "zario/structured/SnapshotEnricher";
logger.addEnricher(new SnapshotEnricher({ includeMemory: true, includeCPU: true }));
```

---

## 10 Smart Fixes

### 1. **Memory Leak Fix**
Properly clean up transports and event listeners on logger destruction.
```typescript
logger.destroy(); // Cleans up all transports, removes listeners
```

### 2. **Circular Reference Handling**
Safely handle circular objects in metadata.
```typescript
// Now handles circular refs automatically
logger.info("Circular test", { 
  self: { } 
});
self.self = self; // No more stack overflow!
```

### 3. **Async Error Handling**
Better error propagation in async mode.
```typescript
logger.on("error", (err) => {
  console.error("Async error caught:", err);
});
```

### 4. **TypeScript Strict Mode**
Full strict type support.
```typescript
// Now works with strict: true in tsconfig
const logger = new Logger<TypeStrictMode>({ /* ... */ });
```

### 5. **Timezone Handling**
Proper timezone configuration for timestamps.
```typescript
new Logger({ 
  timezone: "America/New_York",  // or "local"
  timestampFormat: "YYYY-MM-DD HH:mm:ss.SSS Z"
});
```

### 6. **Stack Trace Enhancement**
Beautified error stack traces with source context.
```typescript
new Logger({ 
  prettyPrint: true,
  includeStackTrace: { sourceContext: true, depth: 5 }
});
```

### 7. **Large Payload Handling**
Auto-truncate massive log messages.
```typescript
new Logger({ 
  maxPayloadSize: 1024 * 1024, // 1MB max
  truncationSuffix: "... [truncated]"
});
```

### 8. **Transport Retry Logic**
Fixed exponential backoff with jitter.
```typescript
new RetryTransport({
  maxRetries: 5,
  backoff: "exponential",
  jitter: true
});
```

### 9. **Child Logger Context**
Fixed context inheritance bugs.
```typescript
// Context now properly merges
const child = parent.createChild({ context: { requestId: "123" } });
// Child has both parent context AND requestId
```

### 10. **JSON Serialization**
Handles non-serializable objects gracefully (BigInt, Symbols, Functions).
```typescript
logger.info("Test", { 
  bigInt: BigInt(123),  // Now serializes properly
  symbol: Symbol("test"), // Converts to string
  func: () => {}, // Safely ignored or stringified
});
```

---

## How to Install & Use

```bash
# Clone your forked repo
git clone https://github.com/YOUR_USERNAME/zario.git
cd zario

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Quick Start
```typescript
import { Logger, ConsoleTransport, FileTransport } from "zario";

const logger = new Logger({
  level: "info",
  transports: [
    new ConsoleTransport(),
    new FileTransport({ path: "./logs/app.log" })
  ]
});

logger.info("🚀 Zario is running!");
logger.warn("⚠️ This is a warning");
logger.error("❌ Something went wrong", { errorCode: 500 });
```

---

## Thanks

Big thanks to **Dev-Dami** for creating zario - it's a fantastic minimal logging library! I just added some features I thought would be useful for enterprise use cases. Hope this helps!

---

*Contributed by Nayak (via Tanya)* 🤖
