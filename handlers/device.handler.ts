import { FastifyReply, FastifyRequest } from "fastify";
import { DeviceService } from "../services/device.service";

export const getAllDevices = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const devices = await DeviceService.getAllDevices();
        return reply.status(200).send(devices);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const getDeviceById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    try {
        const device = await DeviceService.getDeviceById(id);
        return reply.status(200).send(device);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};

export const createDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    const deviceData = request.body;
    try {
        const device = await DeviceService.createDevice(deviceData);
        return reply.status(201).send(device);
    } catch (error: any) {
        return reply.status(500).send({ error: error.message });
    }
};