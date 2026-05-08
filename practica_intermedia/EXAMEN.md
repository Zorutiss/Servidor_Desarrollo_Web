# EXAMEN — F8: Cierra los agujeros

## Reto
Integración completa de las piezas del stack — código presente pero no conectado es código que no existe.

---

## Tarea técnica

### 1. express-mongo-sanitize activado
**Archivo:** `src/app.js`

Importado y montado tras los parsers con la opción `sanitizeObjects: ['body', 'params']` para compatibilidad con Express 5 (que protege `req.query` como solo lectura).

### 2. AppError.tooManyRequests añadido
**Archivo:** `src/utils/AppError.js`

Añadido el método estático `tooManyRequests` después de `conflict`:
```js
static tooManyRequests(msg = 'Demasiados intentos') { return new AppError(msg, 429); }
```

### 3. Control de propiedad en signDeliveryNote
**Archivo:** `src/controllers/sign.controller.js`

Añadido guard antes de la comprobación de `note.signed`:
```js
const isOwner = note.user.toString() === req.user._id.toString();
const isAdmin = req.user.role === 'admin';
if (!isOwner && !isAdmin) {
  return next(AppError.forbidden('Solo el creador o un admin puede firmar este albarán'));
}
```

### 4. Anotaciones @swagger en client.routes.js
**Archivo:** `src/routes/client.routes.js`

Añadidos 7 bloques @swagger (GET /, GET /archived, GET /:id, POST /, PUT /:id, DELETE /:id, PATCH /:id/restore) con respuestas 200/201/400/401/404/409.

---

## Respuestas socráticas

### 1. ¿Qué ataque previene express-mongo-sanitize?

Previene la **inyección NoSQL**. Sin el middleware, un atacante puede enviar este payload en el body:

```json
{
  "email": { "$gt": "" },
  "password": "cualquiercosa"
}
```

El operador `$gt` (mayor que) de MongoDB haría que la query devuelva todos los usuarios cuyo email sea mayor que vacío — es decir, todos. El atacante podría hacer login sin conocer la contraseña real de ningún usuario.

### 2. ¿Qué pasa cuando llamas a un método estático inexistente?

Node.js lanza un `TypeError: AppError.tooManyRequests is not a function`. Como este error no es una instancia de `AppError`, el `error-handler.js` no lo reconoce como error operacional y devuelve un **500** en lugar del **429** esperado.

Los tests no lo detectaron porque ningún test agotaba los 3 intentos de verificación de email — el flujo de validación con código incorrecto x3 nunca fue ejercitado en los tests.

### 3. ¿Puede un guest firmar el albarán de un admin?

Sin el guard, sí podía — cualquier usuario autenticado de la misma compañía podía firmar cualquier albarán. Esto no es correcto según la lógica de negocio: la firma es un acto legal que debe realizarlo el creador del albarán o un administrador.

El campo del modelo usado es `note.user` — comparándolo con `req.user._id` determinamos si el usuario es el creador. Si no lo es, comprobamos si tiene rol `admin`.

### 4. ¿Por qué Swagger no generaba doc para clientes?

Porque `client.routes.js` no tenía comentarios `@swagger` JSDoc. Swagger-jsdoc escanea los archivos de rutas buscando bloques `/** @swagger ... */` justo encima de cada ruta. Sin esos comentarios, el endpoint existe y funciona pero no aparece en la documentación de `/api-docs`.

La diferencia estructural con `user.routes.js` es que este sí tiene bloques JSDoc encima de cada `router.post/get/put...`.

### 5. Riesgo de CORS con origin: '*' en Socket.IO

Con `origin: '*'` cualquier sitio web puede establecer una conexión WebSocket con nuestro servidor. Esto abre la puerta a ataques **CSRF** (Cross-Site Request Forgery) donde una web maliciosa podría conectarse a nuestro Socket.IO y recibir eventos en tiempo real de otras compañías si consiguiera un token válido.

Para restringirlo usando `src/config/index.js` añadiríamos:

```js
// config/index.js
allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',

// socket/index.js
const io = new Server(httpServer, {
  cors: { origin: config.allowedOrigin, methods: ['GET', 'POST'] },
});
```

Así en producción se configura el dominio real (Railway, Vercel...) y en desarrollo funciona con localhost.

---

## Proceso

1. Identificados los 4 puntos de mejora señalados en el reto
2. Añadido `AppError.tooManyRequests` en `src/utils/AppError.js`
3. Activado `express-mongo-sanitize` en `src/app.js` con opción `sanitizeObjects` para compatibilidad con Express 5
4. Añadido control de propiedad en `signDeliveryNote` usando `note.user` vs `req.user._id`
5. Añadidos 7 bloques `@swagger` en `src/routes/client.routes.js`
6. Respondidas las preguntas socráticas analizando el código existente
