import app from './app';
import { config } from './config/env';
import { initPool, closePool } from './config/database';
import { logger } from './utils/logger';

async function startServer() {
  console.clear();
  try {
    // 1. Initialize Oracle Database connection pool
    logger.info('Initializing Oracle connection pool...');
    await initPool();
    logger.info('Oracle Database connected successfully.');

    // 2. Start Express server
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`=================================`);
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`=================================`);
    });

    // 3. Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await closePool();
        process.exit(0);
      });

      // Force close if taking too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start application
startServer();
