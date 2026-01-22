import { FastifyPluginAsync } from 'fastify';
import fastifyPostgres from '@fastify/postgres';

const postgresPlugin: FastifyPluginAsync = async (fastify) => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  await fastify.register(fastifyPostgres, {
    connectionString: databaseUrl,
  });
};

export default postgresPlugin;
