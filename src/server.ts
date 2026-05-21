import app from './app';
import { env } from './config/env';
import { closeDB, connectDB } from './db/connectDB';

async function bootstrap() {
  await connectDB();
  const server = app.listen(env.PORT, () => {
    console.log(`Bornil Vibes API running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
