import { app } from './app';
import { config, logger, prisma } from './config';

const server = app.listen(config.port, () => {
  logger.info(`PeopleCore Core Express API server running on port ${config.port} in ${config.env} mode.`);
});

// Graceful shutdown handling
const handleGracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcefully killing process.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
