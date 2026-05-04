import { app, httpServer } from './app.js';
import { connectDB, disconnectDB } from './config/database.js';
import { config } from './config/index.js';

const PORT = config.port;

async function main() {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`🚀 BildyApp API corriendo en http://localhost:${PORT}`);
    console.log(`📋 Health check en http://localhost:${PORT}/api/health`);
  });
}

// ── Graceful shutdown ──────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n🛑 Señal ${signal} recibida. Cerrando servidor...`);
  httpServer.close(async () => {
    await disconnectDB();
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((err) => {
  console.error('❌ Error arrancando el servidor:', err.message);
  process.exit(1);
});
