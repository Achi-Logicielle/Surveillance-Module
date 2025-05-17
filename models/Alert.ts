import mongoose from "mongoose";
import Device from "./Device";

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Device,
    required: true,
    },
  timestamp: { type: Date, default: Date.now },
  alertType: { type: String, enum: ["motion", "sound", "temperature", "overheat"], required: true },
});

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;
