import app from './app';
import { config } from './config';
import { initializeSchema, closeDb } from './services/database';

async function main() {
  await initializeSchema();

  const server = app.listen(config.port, () => {
    console.log(`MarketList API running on http://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await closeDb();
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
