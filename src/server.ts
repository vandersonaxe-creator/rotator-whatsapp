import 'dotenv/config';
import { buildApp } from './app';
import { config } from './config/env';

const PORT = config.port;

async function start() {
  try {
    const app = await buildApp();

    // Health check endpoint
    app.get('/health', async (request, reply) => {
      return reply.code(200).send({ status: 'ok' });
    });

    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server listening on port ${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
