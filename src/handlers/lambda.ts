/**
 * Lambda Handler for Zario
 * Optimized handler for AWS Lambda
 */

import { Logger, ConsoleTransport, LogLevel, LoggerOptions } from '../index.js';

export interface LambdaHandlerOptions extends LoggerOptions {
  level?: LogLevel;
  includeContext?: boolean;
}

export function lambdaHandler(options: LambdaHandlerOptions = {}) {
  const logger = new Logger({
    level: options.level ?? 'info',
    colorize: false,
    json: true,
    transports: [new ConsoleTransport()],
    timestamp: true,
    ...options
  });

  // Add Lambda enricher as a function
  const lambdaEnricher = (logData: any) => {
    logData.metadata = logData.metadata || {};
    logData.metadata.aws = {
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
      functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown',
      memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown',
    };
    logData.metadata.requestId = process.env.AWS_REQUEST_ID || 'unknown';
    return logData;
  };
  
  logger.addEnricher(lambdaEnricher);

  return async (event: any, context: any) => {
    const startTime = Date.now();
    logger.info('Lambda started', { requestId: context?.awsRequestId });
    try {
      const result = { statusCode: 200, body: JSON.stringify({ message: 'OK' }) };
      logger.info('Lambda completed', { duration: Date.now() - startTime });
      return result;
    } catch (error: any) {
      logger.error('Lambda failed', { error: error.message, duration: Date.now() - startTime });
      return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
    }
  };
}

export default lambdaHandler;
