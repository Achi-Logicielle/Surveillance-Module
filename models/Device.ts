import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  type: String,
  model: String,
  firmware_version: String,
  status: String,
  location: String,
  registration_date: { type: Date, default: Date.now },
  configuration: {
    sampling_interval_sec: { type: Number, required: true },
    calibration_date: { type: String, required: true },
    thresholds: {
      voltage: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      current: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      temperature: {
        max: { type: Number, required: true },
      },
    },
  },
}); 

const Device = mongoose.model("Device", DeviceSchema);
export default Device;
