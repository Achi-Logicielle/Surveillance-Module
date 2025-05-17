import { FastifyReply, FastifyRequest } from "fastify";
import { surveillanceService } from "../services/surveillance.service";

export const getAllAlerts = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const alerts = await surveillanceService.getAllAlerts();
        return reply.status(200).send(alerts);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const getAlertById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const alert = await surveillanceService.getAlertById(id);
        return reply.status(200).send(alert);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const createAlert = async (request: FastifyRequest, reply: FastifyReply) => {
    const alertData = request.body;
    try {
        const alert = await surveillanceService.createAlert(alertData);
        return reply.status(201).send(alert);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const getAllTelemetries = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const telemetries = await surveillanceService.getAllTelemetries();
        return reply.status(200).send(telemetries);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const createTelemetry = async (request: FastifyRequest, reply: FastifyReply) => {
    const telemetryData = request.body;
    try {
        const telemetry = await surveillanceService.createTelemetry(telemetryData);
        return reply.status(201).send(telemetry);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const verifyDeviceTelemetry = async (request: FastifyRequest, reply: FastifyReply) => {
    const { alertId } = request.params as { alertId: string };
    try {
        const telemetry = await surveillanceService.verifyDeviceTelemetry(alertId);
        return reply.status(200).send(telemetry);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

