import { app, httpServer } from './app.js';
import { connectDB, disconnectDB } from './config/database.js';
import { config } from './config/index.js';

const PORT = config.port;

async function main() {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`BildyApp API corriendo en http://localhost:${PORT}`);
    console.log(`Health check en http://localhost:${PORT}/api/health`);
  });
}

//Terminar peticiones antes de cerrar
const shutdown = async (signal) => {
  console.log(`\nSeñal ${signal} recibida. Cerrando servidor...`);
  httpServer.close(async () => {
    await disconnectDB();
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((err) => {
  console.error('Error arrancando el servidor:', err.message);
  process.exit(1);
});
