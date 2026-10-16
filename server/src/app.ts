import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import passport from './lib/passport';
import { prisma } from './lib/prisma';
import globalErrorHandler from './middlewares/globalErrorHandler';
import notFound from './middlewares/notFound';
import { WebhookRoutes } from './modules/webhook/webhook.route';
import router from './routes';

const app = express();
// Behind proxies (Vercel, the Next.js rewrite), so rate limits and logs see the client IP
app.set('trust proxy', config.trustProxy);

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// Stripe webhooks need the raw body for the signature check: mount BEFORE express.json()
app.use('/api/v1/webhooks', WebhookRoutes);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', db: 'ok' });
});

app.use('/api/v1', router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
