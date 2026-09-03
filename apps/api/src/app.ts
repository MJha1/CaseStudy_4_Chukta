import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { requireDeviceId } from './deviceId.js';
import { vehiclesRouter } from './routes/vehicles.js';
import { challansRouter } from './routes/challans.js';
import { disputesRouter } from './routes/disputes.js';
import { analyticsRouter } from './routes/analytics.js';

/** Build the Express app. Exported (unlistened) so tests can drive it directly. */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  // Challan screenshots ride along as data URLs, so allow a generous body.
  app.use(express.json({ limit: '8mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // All data routes require an anonymous device id.
  app.use('/vehicles', requireDeviceId, vehiclesRouter);
  app.use('/challans', requireDeviceId, challansRouter);
  app.use('/disputes', requireDeviceId, disputesRouter);
  app.use('/analytics', requireDeviceId, analyticsRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Central error handler (Express 5 forwards async errors here).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api] unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
