import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Load environment variables. The database secret lives in a single place —
 * `packages/db/.env` — which the Prisma CLI also reads, so migrations, seeding
 * and the running server share one source of truth. A real DATABASE_URL in the
 * process environment (e.g. on Vercel/Railway/Neon) always wins.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const dbEnv = path.resolve(here, '../../../packages/db/.env');

config(); // apps/api/.env, if present
config({ path: dbEnv }); // packages/db/.env (does not override already-set vars)

export const PORT = Number(process.env.PORT ?? 4000);
export const HAS_DATABASE_URL = Boolean(process.env.DATABASE_URL);
