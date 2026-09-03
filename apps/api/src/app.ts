import express, {
  Router,
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { requireDeviceId } from './deviceId.js';
import { vehiclesRouter } from './routes/vehicles.js';
import { challansRouter } from './routes/challans.js';
import { disputesRouter } from './routes/disputes.js';
import { analyticsRouter } from './routes/analytics.js';
import { providersRouter } from './routes/providers.js';
import { demoRouter } from './routes/demo.js';

/** Build the Express app. Exported (unlistened) so tests can drive it directly. */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  // Challan screenshots ride along as data URLs, so allow a generous body.
  app.use(express.json({ limit: '8mb' }));

  // --- API, mounted under /api (same prefix in dev and prod) ---
  const api = Router();
  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
  api.use('/vehicles', requireDeviceId, vehiclesRouter);
  api.use('/challans', requireDeviceId, challansRouter);
  api.use('/disputes', requireDeviceId, disputesRouter);
  api.use('/analytics', requireDeviceId, analyticsRouter);
  api.use('/demo', requireDeviceId, demoRouter);
  api.use('/providers', providersRouter);
  app.use('/api', api);

  // Unknown /api routes → JSON 404 (before the SPA fallback).
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // --- Static web app (production single-service deploy) ---
  serveWebIfBuilt(app);

  // Central error handler (Express 5 forwards async errors here).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api] unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

/**
 * When the web app has been built (apps/web/dist exists), serve it as static
 * files with an SPA fallback so client-side routes resolve. In local dev the
 * dist folder is absent and Vite serves the web app instead — this is a no-op.
 */
function serveWebIfBuilt(app: Express): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const webDist = path.resolve(here, '../../web/dist');
  if (!fs.existsSync(path.join(webDist, 'index.html'))) return;

  app.use(express.static(webDist));
  // SPA fallback: any non-API, non-asset GET returns index.html.
  app.use((_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}
