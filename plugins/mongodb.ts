import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export default fp(async function (fastify, opts) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MongoDB URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri);
    fastify.log.info('Connected to MongoDB');
  } catch (err) {
    fastify.log.error(err, 'Failed to connect to MongoDB');
    throw err;
  }
});
