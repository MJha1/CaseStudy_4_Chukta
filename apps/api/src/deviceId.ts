import type { Request, Response, NextFunction } from 'express';

/** The reserved device id under which shared sample data is stored. */
export const SAMPLE_DEVICE_ID = 'SAMPLE';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      deviceId: string;
    }
  }
}

/**
 * Every request must carry an anonymous `x-device-id` header (generated once
 * client-side). We reject the reserved SAMPLE id so callers can't write to the
 * shared sample dataset.
 */
export function requireDeviceId(req: Request, res: Response, next: NextFunction): void {
  const raw = req.header('x-device-id');
  const deviceId = typeof raw === 'string' ? raw.trim() : '';
  if (!deviceId) {
    res.status(400).json({ error: 'Missing x-device-id header' });
    return;
  }
  if (deviceId === SAMPLE_DEVICE_ID) {
    res.status(400).json({ error: 'Reserved device id' });
    return;
  }
  req.deviceId = deviceId;
  next();
}
