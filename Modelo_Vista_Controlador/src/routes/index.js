import { Router } from 'express';
import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath, pathToFileURL  } from 'url';
import { dirname } from 'path';

const router = Router();

// Obtener __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);  
const __dirname = dirname(__filename);

// Leer los archivos de rutas
const routeFiles = readdirSync(__dirname).filter(
  (file) => file.endsWith('.routes.js')
);

// Cargar dinámicamente las rutas
console.log(routeFiles);  
const loadRoutes = async () => {
  for (const file of routeFiles) {
    const routeName = file.replace('.routes.js', '');
    
    // Aquí es donde hacemos la conversión a file:// URL
    const fileURL = pathToFileURL(join(__dirname, file)).href;
    const routeModule = await import(fileURL);
    
    router.use(`/${routeName}`, routeModule.default);
    console.log(`📍 Ruta cargada: /api/${routeName}`);
  }
};

// Llamar la función para cargar las rutas
loadRoutes();


export default router;