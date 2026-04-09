import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log('📦 Conectado a Supabase (Prisma)');

    app.listen(PORT, () => {
      console.log(`📚 Biblioteca API corriendo en http://localhost:${PORT}`);
      console.log(`📖 Swagger disponible en http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  }
}

main();
