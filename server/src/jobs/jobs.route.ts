import { Router } from 'express';
import httpStatus from 'http-status';
import AppError from '../errors/AppError';
import requireCronSecret from '../middlewares/requireCronSecret';
import catchAsync from '../utils/catchAsync';
import sendResponse from '../utils/sendResponse';
import { findJob } from './registry';

const router = Router();

const runJob = catchAsync(async (req, res) => {
  const job = findJob(String(req.params.name));
  if (!job) throw new AppError(404, 'NOT_FOUND', 'Unknown job');

  const startedAt = Date.now();
  const result = await job.run();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: `Job ${job.name} finished`,
    data: { job: job.name, durationMs: Date.now() - startedAt, ...result },
  });
});

// GET for Vercel Cron, POST for other schedulers
router.get('/:name', requireCronSecret, runJob);
router.post('/:name', requireCronSecret, runJob);

export const JobRoutes = router;
