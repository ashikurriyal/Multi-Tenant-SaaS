import type { Server } from 'node:http';
import app from './app';
import config from './config';

let server: Server;

function main() {
  server = app.listen(config.port, () => {
    console.info(`LedgerFlow API listening on http://localhost:${config.port}`);
  });
}

function shutdown(signal: string) {
  console.info(`${signal} received, shutting down`);
  server?.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main();
