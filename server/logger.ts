/*
  Logging has been disabled as per request. The original Winston-based implementation
  is commented out below for reference. All logger functions now no-op to avoid
  runtime errors while keeping the same API surface so existing imports continue to work.
*/

// import winston from 'winston';

// // Custom format for better readability
// const customFormat = winston.format.printf(({ level, message, timestamp, module, ...metadata }) => {
//   let msg = `${timestamp} [${level}]${module ? ` [${module}]` : ''}: ${message}`;
//   if (Object.keys(metadata).length > 0) {
//     msg += ` ${JSON.stringify(metadata)}`;
//   }
//   return msg;
// });
//
// // For Vercel and serverless environments, we only use console transport
// // Vercel automatically captures console output in their logging system
// const transports: winston.transport[] = [
//   new winston.transports.Console({
//     format: winston.format.combine(
//       winston.format.colorize({ all: process.env.NODE_ENV !== 'production' }),
//       winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//       customFormat
//     ),
//   }),
// ];
//
// export const logger = winston.createLogger({
//   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     winston.format.json()
//   ),
//   transports,
//   // Don't exit on uncaught exceptions in production
//   exitOnError: false,
// });
//
// if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
//   logger.add(new winston.transports.Console({
//     format: winston.format.simple(),
//     level: 'error',
//     handleExceptions: true,
//     handleRejections: true,
//   }));
// }
//
// export const createLogger = (module: string) => {
//   return logger.child({ module });
// };
//
// export const logForVercel = {
//   info: (message: string, meta?: any) => {
//     console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
//     logger.info(message, meta);
//   },
//   error: (message: string, meta?: any) => {
//     console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
//     logger.error(message, meta);
//   },
//   warn: (message: string, meta?: any) => {
//     console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
//     logger.warn(message, meta);
//   },
//   debug: (message: string, meta?: any) => {
//     if (process.env.NODE_ENV !== 'production') {
//       console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
//     }
//     logger.debug(message, meta);
//   }
// };

// ---------------------------------------------------------------------------
// Replacement no-op logger implementation
// ---------------------------------------------------------------------------

type LogMethod = (message: string, meta?: unknown) => void;

const noop: LogMethod = () => {};

export const logger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
  child: () => logger,
};

export const createLogger = (_module: string) => logger;

export const logForVercel = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
}; 
