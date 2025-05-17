import { FastifyInstance } from "fastify";
import {
    getAllDevices,
    getDeviceById,
    createDevice
} from "../handlers/device.handler";

export default async function deviceRoutes(fastify: FastifyInstance) {
  fastify.get("/devices", getAllDevices);
  fastify.get("/devices/:id", getDeviceById);
  fastify.post("/devices", createDevice);
}