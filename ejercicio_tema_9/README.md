# 📚 Biblioteca API

API REST para gestión de una biblioteca digital con **Supabase** + **Prisma** + **Express**.

## Stack

- **Node.js** (ESM)
- **Express** — framework HTTP
- **Prisma** — ORM para PostgreSQL
- **Supabase** — base de datos PostgreSQL en la nube
- **JWT** — autenticación
- **bcryptjs** — hash de contraseñas
- **Zod** — validación de datos
- **Swagger** — documentación automática
- **Jest + Supertest** — tests de integración

---

## Configuración rápida

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Ve a **Settings → Database** y copia la `CONNECTION STRING` (modo **URI**)
3. Copia también la `Direct connection URL`

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
PORT=3000
JWT_SECRET=supersecretkey_min32chars_requerido
JWT_EXPIRES_IN=2h
```

> ⚠️ `DATABASE_URL` usa el pooler (puerto 6543 o con `?pgbouncer=true`) para la app.  
> `DIRECT_URL` es la conexión directa (puerto 5432) para las migraciones de Prisma.

### 4. Generar el cliente Prisma

```bash
npm run db:generate
```

### 5. Aplicar migraciones

```bash
npm run db:migrate
# Cuando pregunte el nombre: "init"
```

### 6. Sembrar datos de prueba

```bash
npm run db:seed
```

Crea:
- 👤 `admin@biblioteca.com` / `admin1234` (ADMIN)
- 👤 `biblioteca@biblioteca.com` / `librarian1234` (LIBRARIAN)
- 👤 `lector1@biblioteca.com` / `user1234` (USER)
- 👤 `lector2@biblioteca.com` / `user1234` (USER)
- 📖 5 libros de ejemplo con préstamos y reseñas

### 7. Arrancar el servidor

```bash
npm run dev
```

Disponible en:
- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api-docs`

---

## Endpoints

### Auth
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | Público | Registrar usuario |
| POST | `/api/auth/login` | Público | Login, devuelve token |
| GET | `/api/auth/me` | Autenticado | Perfil del usuario |

### Books
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/books` | Público | Listar libros (filtros + paginación) |
| GET | `/api/books/:id` | Público | Obtener libro |
| POST | `/api/books` | Librarian/Admin | Crear libro |
| PUT | `/api/books/:id` | Librarian/Admin | Actualizar libro |
| DELETE | `/api/books/:id` | Admin | Eliminar libro |
| GET | `/api/books/stats` | Librarian/Admin | Estadísticas (BONUS) |

### Loans
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/loans` | Autenticado | Mis préstamos |
| GET | `/api/loans/all` | Librarian/Admin | Todos los préstamos |
| POST | `/api/loans` | Autenticado | Solicitar préstamo |
| PUT | `/api/loans/:id/return` | Autenticado | Devolver libro |

### Reviews
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/books/:id/reviews` | Público | Reseñas de un libro |
| POST | `/api/books/:id/reviews` | Autenticado | Crear reseña |
| DELETE | `/api/reviews/:id` | Autenticado | Eliminar reseña |

---

## Reglas de negocio

- Máximo **3 préstamos activos** por usuario
- No se puede prestar el **mismo libro dos veces** a la vez
- Solo se presta si hay **ejemplares disponibles** (`available > 0`)
- Duración del préstamo: **14 días**
- Solo se puede reseñar un libro si tienes un **préstamo devuelto** de ese libro
- Máximo **una reseña por usuario por libro**

---

## Filtros disponibles en GET /api/books

```
?genre=Fiction
?author=Orwell
?available=true
?search=gatsby       # busca en título, autor e ISBN
?page=1&limit=10     # paginación
```

---

## Scripts

```bash
npm run dev          # Servidor con hot-reload
npm start            # Servidor en producción
npm run db:studio    # Abrir Prisma Studio (GUI visual)
npm run db:migrate   # Crear nueva migración
npm run db:push      # Sincronizar schema sin migración
npm run db:seed      # Sembrar datos de prueba
npm test             # Ejecutar tests Jest
```

---

## Tests

Los tests de integración están en `tests/api.test.js` y cubren:

- Registro, login y perfil (auth)
- CRUD de libros con control de roles
- Sistema completo de préstamos (crear, devolver, validaciones)
- Reseñas con validación de préstamo devuelto

Para ejecutarlos necesitas `DATABASE_URL` en tu `.env` apuntando a una BD de test o la misma de desarrollo.

```bash
npm test
```

---

## Prisma Studio

Interfaz visual para explorar y editar datos directamente:

```bash
npm run db:studio
# Abre http://localhost:5555
```
