import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import { prisma } from './lib/prisma';

const app = express();
app.set('trust proxy', 1); // behind Render/Railway's proxy, so rate limits see the real client IP

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// The Stripe webhook route (raw body) will be mounted here, BEFORE express.json()

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', db: 'ok' });
});

export default app;
