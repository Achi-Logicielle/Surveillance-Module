import { FastifyInstance } from "fastify";
import {
  getAllAlerts,
  getAlertById,
  createAlert,
  getAllTelemetries} from "../handlers/surveillance.handler";
import { createTelemetry } from "../handlers/surveillance.handler";
import { verifyDeviceTelemetry } from "../handlers/surveillance.handler";

export default async function surveillanceRoutes(fastify: FastifyInstance) {
  fastify.get("/alerts", getAllAlerts);
  fastify.get("/alerts/:id", getAlertById);
  fastify.post("/alerts", createAlert);
  fastify.get("/telemetries", getAllTelemetries);
  fastify.post("/telemetries", createTelemetry);
  fastify.post("/alerts/:alertId/verify", verifyDeviceTelemetry);
}