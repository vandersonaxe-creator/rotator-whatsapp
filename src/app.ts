import Fastify, { FastifyInstance } from 'fastify';
import fastifyPostgres from '@fastify/postgres';
import joinRoutes from './rotator/routes/join.routes';
import internalRotateRoutes from './rotator/routes/internal.rotate.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Register PostgreSQL plugin directly (no wrapper to avoid scope issues)
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse connection string and ensure SSL config is applied
  // Remove sslmode from connection string if present to avoid conflicts
  const cleanUrl = databaseUrl.replace(/[?&]sslmode=[^&]*/gi, '');
  
  await app.register(fastifyPostgres, {
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  // Register routes (same scope as postgres)
  await app.register(joinRoutes);
  await app.register(internalRotateRoutes);

  return app;
}
