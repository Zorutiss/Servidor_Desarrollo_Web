import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/index.js';

mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(config.port, () => {
      console.log(`BildyApp API corriendo en http://localhost:${config.port}`);
      console.log(`Endpoints disponibles en http://localhost:${config.port}/api/user`);
    });
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
