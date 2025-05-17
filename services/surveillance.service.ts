import Alert from "../models/Alert";
import { Telemetry } from "../models/Telemetry";
import Device from "../models/Device";

export const surveillanceService = {
    async getAllAlerts() {
        try {
            const alerts = await Alert.find().populate("deviceId");
            return alerts;
        } catch (error: any) {
            throw new Error("Error fetching alerts: " + error.message);
        }
    },

    async getAlertById(id: string) {
        try {
            const alert = await Alert.findById(id);
            if (!alert) {
                throw new Error("Alert not found");
            }
            return alert;
        } catch (error: any) {
            throw new Error("Error fetching alert: " + error.message);
        }
    },

    async createAlert(alertData: any) {
        try {
            const alert = new Alert(alertData);
            await alert.save();
            return alert;
        } catch (error: any) {
            throw new Error("Error creating alert: " + error.message);
        }
    },

    async createTelemetry(telemetryData: any) {
        try {
            const telemetry = new Telemetry(telemetryData);
            await telemetry.save();
            return telemetry;
        } catch (error: any) {
            throw new Error("Error creating telemetry: " + error.message);
        }
    },

    async getAllTelemetries() {
        try {
            const telemetries = await Telemetry.find();
            return telemetries;
        } catch (error: any) {
            throw new Error("Error fetching telemetries: " + error.message);
        }
    },

    verifyDeviceTelemetry: async (alertId: string) => {
        try {
            // Récupérer l'alerte
            const alert = await Alert.findById(alertId);
            if (!alert) {
                throw new Error("Alert not found");
            }

            // Récupérer le device lié à l'alerte
            const device = await Device.findById(alert.deviceId._id);
            if (!device) {
                throw new Error("Device not found");
            }

            const telemetryData = await Telemetry.findOne({ deviceId: device._id }).sort({ timestamp: -1 });
            if (!telemetryData) {
                throw new Error("Telemetry data not found for this device");
            }

            const thresholds = device.configuration?.thresholds;
            if (!thresholds) {
                throw new Error("No thresholds defined for this device");
            }

            const issues: string[] = [];

            const isBetween = (value: number, min: number, max: number) => value >= min && value <= max;

            if (
                telemetryData.voltage !== undefined && telemetryData.voltage !== null &&
                thresholds.voltage?.min != null &&
                thresholds.voltage?.max != null &&
                !isBetween(telemetryData.voltage, thresholds.voltage.min, thresholds.voltage.max)
            ) {
                issues.push(`Voltage out of range: ${telemetryData.voltage}V`);
            }

            if (
                telemetryData.current !== undefined && telemetryData.current !== null &&
                thresholds.current?.min != null &&
                thresholds.current?.max != null &&
                !isBetween(telemetryData.current, thresholds.current.min, thresholds.current.max)
            ) {
                issues.push(`Current out of range: ${telemetryData.current}A`);
            }

            if (
                telemetryData.temperature !== undefined && telemetryData.temperature !== null &&
                thresholds.temperature?.max != null &&
                telemetryData.temperature > thresholds.temperature.max
            ) {
                issues.push(`Temperature too high: ${telemetryData.temperature}°C`);
            }

            return {
                status: issues.length === 0 ? "normal" : "anomalous",
                issues,
            };
        } catch (error: any) {
            throw new Error("Error verifying device telemetry: " + error.message);
        }
    }
}