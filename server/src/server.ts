import type { Server } from 'node:http';
import app from './app';
import config from './config';
import { prisma } from './lib/prisma';

let server: Server;

async function main() {
  await prisma.$connect();
  console.info('Database connected');

  server = app.listen(config.port, () => {
    console.info(`LedgerFlow API listening on http://localhost:${config.port}`);
  });
}

function shutdown(signal: string) {
  console.info(`${signal} received, shutting down`);
  server?.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch(async (err) => {
  console.error('Failed to start server:', err);
  await prisma.$disconnect();
  process.exit(1);
});
