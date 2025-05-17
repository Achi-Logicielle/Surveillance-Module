import { verify } from "crypto";
import Device from "../models/Device";


export const DeviceService = {
    getAllDevices: async () => {
        try {
            const devices = await Device.find();
            return devices;
        } catch (error: any) {
            throw new Error("Error fetching devices: " + error.message);
        }
    },

    getDeviceById: async (id: string) => {
        try {
            const device = await Device.findById(id);
            if (!device) {
                throw new Error("Device not found");
            }
            return device;
        } catch (error: any) {
            throw new Error("Error fetching device: " + error.message);
        }
    },

    createDevice: async (deviceData: any) => {
        try {
            const device = new Device(deviceData);
            await device.save();
            return device;
        } catch (error: any) {
            throw new Error("Error creating device: " + error.message);
        }
    }

}