import Fastify from 'fastify';
import mongodb from './plugins/mongodb';
import surveillanceRoutes from './routes/index.routes';

const app = Fastify({ logger: true });

app.register(mongodb);
app.register(surveillanceRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log('Server listening on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
