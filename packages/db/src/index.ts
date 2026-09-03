import { PrismaClient } from '@prisma/client';

/**
 * A single shared PrismaClient instance. In dev we stash it on globalThis so
 * hot-reloads (tsx watch) don't exhaust the connection pool by creating a new
 * client on every reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
