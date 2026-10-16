import express, { Router } from 'express';
import { WebhookController } from './webhook.controller';

const router = Router();

// Stripe signs the exact bytes it sends, so this route reads the raw body. It is mounted
// in app.ts BEFORE express.json(), which would otherwise consume and re-shape the body.
// No auth middleware: Stripe has no JWT — the signature check replaces it.
router.post(
  '/stripe',
  express.raw({ type: 'application/json', limit: '1mb' }),
  WebhookController.handleStripe,
);

export const WebhookRoutes = router;
