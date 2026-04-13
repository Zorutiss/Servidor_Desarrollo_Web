# BildyApp API

API REST para la gestión de usuarios de BildyApp — sistema de gestión de albaranes.

## Stack tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js 22+ (ESM) |
| Framework | Express 5 |
| Base de datos | MongoDB Atlas + Mongoose |
| Validación | Zod (transform + refine + discriminatedUnion) |
| Autenticación | JWT (access 15m + refresh 7d) + bcryptjs |
| Subida archivos | Multer (5 MB max) |
| Seguridad | Helmet + express-rate-limit + express-mongo-sanitize |
| Eventos | Node.js EventEmitter |

---

## Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run dev
```

### Variables de entorno

```env
MONGODB_URI=mongodb+srv://user:pass@cluster/bildyapp
PORT=3000
JWT_ACCESS_SECRET=access_secret_min32chars
JWT_REFRESH_SECRET=refresh_secret_min32chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

---

## Endpoints

### Auth
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/user/register` | Público | Registro (genera código verificación) |
| POST | `/api/user/login` | Público | Login → access + refresh token |
| POST | `/api/user/refresh` | Público | Renovar access token |
| POST | `/api/user/logout` | Autenticado | Cerrar sesión |

### Onboarding
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| PUT | `/api/user/validation` | Autenticado | Verificar email con código 6 dígitos |
| PUT | `/api/user/register` | Autenticado | Datos personales (nombre, apellidos, NIF) |
| PATCH | `/api/user/company` | Autenticado | Crear/unirse a compañía por CIF |
| PATCH | `/api/user/logo` | Autenticado | Subir logo de compañía (multipart) |

### Perfil
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/user` | Autenticado | Perfil completo con populate company |
| DELETE | `/api/user?soft=true` | Autenticado | Soft delete (desactiva) |
| DELETE | `/api/user?soft=false` | Autenticado | Hard delete (elimina) |
| PUT | `/api/user/password` | Autenticado | Cambiar contraseña (BONUS) |
| POST | `/api/user/invite` | Admin | Invitar compañero a la compañía |

---

## Flujo completo de uso

1. **Registro** → recibes `accessToken` y `refreshToken` + código en consola
2. **Verificar email** → envía el código de 6 dígitos (máximo 3 intentos)
3. **Datos personales** → nombre, apellidos, NIF
4. **Compañía** → si el CIF no existe → crea compañía (admin). Si existe → se une (guest)
5. **Logo** → sube imagen con `multipart/form-data`
6. **Usar la API** → token expira en 15 min, usa `/refresh` para renovarlo

---

## Lógica de roles

- **admin** → crea la compañía (CIF nuevo) o es el primer usuario
- **guest** → se une a una compañía existente (mismo CIF) o es invitado
- Solo **admin** puede invitar compañeros (`POST /api/user/invite`)

---

## EventEmitter — Eventos emitidos

| Evento | Cuándo |
|--------|--------|
| `user:registered` | Al registrarse → muestra el código en consola |
| `user:verified` | Al verificar el email |
| `user:invited` | Al invitar un compañero → muestra contraseña temporal en consola |
| `user:deleted` | Al eliminar la cuenta |

---

## Seguridad

- **Helmet** → cabeceras HTTP seguras
- **express-rate-limit** → 100 req/15min general, 10 req/15min en auth
- **express-mongo-sanitize** → previene inyección NoSQL
- **bcryptjs** → 10 rounds de salt
- **JWT** → access token (15m) + refresh token (7d) rotatorio

---

## Tests

Usa el archivo `tests/api.http` con la extensión **REST Client** de VS Code para probar todos los endpoints con ejemplos de éxito y error.
