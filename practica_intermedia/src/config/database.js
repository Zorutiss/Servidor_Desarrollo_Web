import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDB = async (uri) => {
  const dbUri = uri || config.mongoUri;
  await mongoose.connect(dbUri);
  console.log('✅ MongoDB conectado');
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('📴 MongoDB desconectado');
};
