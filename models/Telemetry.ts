
import mongoose from 'mongoose';

const telemetrySchema = new mongoose.Schema({
  telemetryId: { type: String, required: true, unique: true },
  voltage: Number,
  current: Number,
  timestamp: Date,
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  temperature: Number,
  humidity: Number,
});

export const Telemetry = mongoose.model('Telemetry', telemetrySchema);
