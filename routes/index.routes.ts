import { FastifyInstance } from 'fastify';
import deviceRoutes from './device.routes';
import surveillanceRoutes from './surveillance.routes';
// Register routers
export default async function indexRoutes(fastify: FastifyInstance) {
    fastify.register(deviceRoutes, { prefix: '/devices' });
    fastify.register(surveillanceRoutes, { prefix: '/surveillance' });
}