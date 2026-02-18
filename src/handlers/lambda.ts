/**
 * Lambda Handler for Zario
 * Optimized handler for AWS Lambda and serverless environments
 */

import { Logger, ConsoleTransport, LogLevel, LoggerOptions } from '../index.js';

export interface LambdaHandlerOptions extends LoggerOptions {
  /** Minimum log level (default: info) */
  level?: LogLevel;
  /** Whether to include Lambda context in logs (default: true) */
  includeContext?: boolean;
  /** Whether to include Lambda request ID (default: true) */
  includeRequestId?: boolean;
  /** Custom field names for Lambda data */
  customFields?: Record<string, any>;
}

/**
 * Creates a Lambda handler with automatic logging
 * 
 * @example
 * import { lambdaHandler } from "zario/handlers/lambda";
 * 
 * export const handler = lambdaHandler();
 * 
 * // Or with custom options
 * export const handler = lambdaHandler({
 *   level: "debug",
 *   includeContext: true
 * });
 */
export function lambdaHandler(options: LambdaHandlerOptions = {}) {
  const logger = new Logger({
    level: options.level ?? 'info',
    colorize: false,
    json: true,
    transports: [new ConsoleTransport()],
    timestamp: true,
    ...options
  });

  // Add Lambda-specific enricher
  logger.addEnricher({
    enrich(logData: any) {
      if (options.includeContext !== false) {
        logData.metadata = logData.metadata || {};
        
        // Note: In Lambda, these would be from the context parameter
        logData.metadata.aws = {
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
          functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION || 'unknown',
          memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown',
          logGroup: process.env.AWS_LAMBDA_LOG_GROUP_NAME || 'unknown',
          logStream: process.env.AWS_LAMBDA_LOG_STREAM_NAME || 'unknown'
        };
      }
      
      if (options.includeRequestId !== false) {
        logData.metadata = logData.metadata || {};
        logData.metadata.requestId = process.env.AWS_REQUEST_ID || 'unknown';
      }
      
      if (options.customFields) {
        logData.metadata = { ...options.customFields, ...logData.metadata };
      }
      
      return logData;
    }
  });

  return async (event: any, context: any) => {
    const startTime = Date.now();
    
    logger.info('Lambda function started', {
      eventType: event?.httpMethod ? 'APIGateway' : 'S3/Event/SQS',
      requestId: context?.awsRequestId
    });

    try {
      // The actual handler would be passed in or defined elsewhere
      // This is a wrapper that logs timing
      const result = {
        statusCode: 200,
        body: JSON.stringify({ message: 'Lambda executed successfully' })
      };
      
      const duration = Date.now() - startTime;
      logger.info('Lambda function completed', { duration, statusCode: 200 });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Lambda function failed', { 
        duration, 
        error: error.message,
        stack: error.stack 
      });
      
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  };
}

export default lambdaHandler;
