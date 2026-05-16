import winston from 'winston';
import path from 'path';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// Custom console format for development
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${stack ?? message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),  // capture stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? combine(json())
        : combine(colorize(), devFormat),
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: combine(json()),
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: combine(json()),
      maxsize: 10_485_760, // 10 MB
      maxFiles: 10,
    }),
  ],
});
