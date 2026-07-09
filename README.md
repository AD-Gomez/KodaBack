# KodaBack - Sistema de Gestión de Propiedades

Backend API profesional para KodaHouse, un sistema premium de gestión de propiedades en Venezuela. Construido con **Clean Architecture**, **TypeScript**, **Express** y **Prisma** sobre **PostgreSQL**.

## ✨ Características

- 🏛️ **Clean Architecture** por módulos (domain → application → infrastructure → presentation)
- 🔐 **Autenticación JWT** con access + refresh tokens rotativos
- 👥 **RBAC** con roles `ADMIN`, `CONTADOR`, `ABOGADO`
- ✅ **Validación tipada** con Zod en todos los endpoints
- 🛡️ **Seguridad**: Helmet, CORS, Rate Limiting, Bcrypt
- 📊 **Logging estructurado** con Pino
- 🧪 **Tests** con Vitest
- 🐘 **PostgreSQL 16** vía Docker Compose
- 📦 **Prisma ORM** con migraciones tipadas
- 🚀 **TypeScript estricto** + ESLint + Prettier

## 📁 Estructura del proyecto

```
src/
├── config/                   # Configuración (env, db)
├── shared/                   # Código compartido entre módulos
│   ├── errors/               # Jerarquía de errores operacionales
│   ├── middleware/           # Auth, validate, errorHandler, etc.
│   ├── types/                # Augmentations de tipos
│   └── utils/                # password, jwt, pagination, etc.
├── modules/                  # Bounded contexts (feature modules)
│   ├── auth/                 # Login, refresh, logout, me
│   ├── dashboard/            # Resumen agregado para el home
│   ├── departamentos/        # CRUD + stats de propiedades
│   ├── arrendatarios/        # CRUD + identidad + documentos
│   ├── reparaciones/         # Solicitudes + servicios recurrentes
│   └── contratos/            # Versiones, cláusulas, firmas, documentos
├── app.ts                    # Composición de la app Express
└── server.ts                 # Bootstrap + graceful shutdown
```

Cada módulo sigue la estructura:
```
modules/<feature>/
├── domain/           # Entidades + contratos de repositorios
├── application/      # Casos de uso (lógica de negocio)
├── infrastructure/   # Implementaciones con Prisma
├── presentation/     # Controllers + validators + routes
└── <feature>.routes.ts
```

## 🚀 Quick start

### 1. Prerrequisitos

- Node.js 20+
- Docker + Docker Compose

### 2. Setup automático

```bash
npm install
cp .env.example .env
npm run setup   # = db:up + prisma:generate + prisma:migrate + prisma:seed
npm run dev
```

### 3. Setup manual paso a paso

```bash
# Levantar PostgreSQL
npm run db:up

# Instalar dependencias
npm install

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Cargar datos de ejemplo (7 departamentos, 7 arrendatarios, contratos, etc.)
npm run prisma:seed

# Iniciar en modo desarrollo
npm run dev
```

El servidor arranca en `http://localhost:3001`.

## 🔑 Credenciales de acceso

| Email | Password | Rol |
|-------|----------|-----|
| `admin@kodahouse.com` | `KodaHouse2024!` | ADMIN |
| `contador@kodahouse.com` | `KodaHouse2024!` | CONTADOR |
| `abogado@kodahouse.com` | `KodaHouse2024!` | ABOGADO |

## 📡 Endpoints principales

Base URL: `http://localhost:3001/api/v1`

### Auth (público)

```
POST   /auth/login       # Obtener access + refresh tokens
POST   /auth/refresh     # Renovar tokens
POST   /auth/logout      # Revocar refresh token (requiere auth)
GET    /auth/me          # Usuario actual (requiere auth)
```

### Dashboard

```
GET    /dashboard/summary    # Métricas agregadas para el home
```

### Departamentos

```
GET    /departamentos        # Lista paginada con filtros
GET    /departamentos/stats  # Estadísticas
GET    /departamentos/:id
POST   /departamentos
PUT    /departamentos/:id
DELETE /departamentos/:id
```

Query params: `page`, `limit`, `estado`, `search`.

### Arrendatarios

```
GET    /arrendatarios
GET    /arrendatarios/:id
POST   /arrendatarios
PUT    /arrendatarios/:id
DELETE /arrendatarios/:id
```

Query params: `page`, `limit`, `estado`, `departamentoId`, `search`.

### Reparaciones

```
GET    /reparaciones           # Solicitudes
GET    /reparaciones/stats
GET    /reparaciones/:id
POST   /reparaciones
PUT    /reparaciones/:id
DELETE /reparaciones/:id

GET    /reparaciones/servicios/all          # Servicios recurrentes
GET    /reparaciones/servicios/:id
POST   /reparaciones/servicios
PUT    /reparaciones/servicios/:id
DELETE /reparaciones/servicios/:id
```

### Contratos

```
GET    /contratos
GET    /contratos/:id
GET    /contratos/departamento/:departamentoId/vigente
POST   /contratos
PUT    /contratos/:id
POST   /contratos/:id/renovar
DELETE /contratos/:id

# Sub-recursos
POST   /contratos/:id/clausulas
PUT    /contratos/:id/clausulas/:clausulaId
DELETE /contratos/:id/clausulas/:clausulaId

POST   /contratos/:id/firmas
PUT    /contratos/:id/firmas/:firmaId
DELETE /contratos/:id/firmas/:firmaId

POST   /contratos/:id/envios
DELETE /contratos/:id/envios/:envioId

POST   /contratos/:id/documentos
DELETE /contratos/:id/documentos/:documentoId
```

## 📜 Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo watch |
| `npm run build` | Compilar a JavaScript |
| `npm run start` | Ejecutar build de producción |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint con autofix |
| `npm run format` | Prettier |
| `npm run typecheck` | TypeScript check |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en modo watch |
| `npm run prisma:studio` | GUI de Prisma para ver datos |
| `npm run prisma:migrate` | Crear/aplicar migración |
| `npm run prisma:seed` | Cargar datos de ejemplo |
| `npm run db:up` / `db:down` | Levantar / bajar PostgreSQL |

## 🧱 Modelo de datos

```
Usuario ──┐
          │ creadoPor
          ▼
       Contrato ──── versión + estado
       │   │ │
       │   │ └── Clausula[]    (orden, texto, editable)
       │   │ ├── Firma[]       (ARRENDATARIO / PROPIETARIO / TESTIGO)
       │   │ ├── EnvioFirma[]  (pendientes de firma digital)
       │   │ ├── Documento[]   (PDFs asociados)
       │   │ └── Historial[]   (cambios por versión)
       │   │
       │   └────► Departamento ◄──┐  1:1 con Arrendatario
       │                          │
       ├──► Arrendatario ────────┘
       │    ├─ Identidad (Cédula, fechas)
       │    └─ Documento[]  (Cédula, CURP, etc.)
       │
       ├──► Reparacion          (prioridad, estado, costo, técnico)
       └──► ServicioActivo      (frecuencia, próxima fecha, proveedor)

Pago ──► Departamento
```

## 🧪 Tests

```bash
npm test                # Ejecutar todos
npm run test:watch      # Modo watch
npm test -- --coverage  # Con cobertura
```

Tests incluidos:
- `src/shared/utils/jwt.test.ts` - firma y verificación de tokens
- `src/shared/utils/password.test.ts` - hash y comparación con bcrypt
- `src/shared/utils/pagination.test.ts` - lógica de paginación
- `src/modules/departamentos/presentation/departamentoValidators.test.ts` - validación con Zod

## 🔒 Seguridad

- **Contraseñas hasheadas** con bcrypt (10 rounds)
- **JWT firmados** con HS256 y secretos separados para access/refresh
- **Refresh tokens rotativos** con revocación en logout
- **Rate limiting** (200 req/15min general, 10 req/15min en login)
- **Helmet** para headers HTTP seguros
- **CORS** configurable vía `CORS_ORIGIN`
- **Validación tipada** de entrada con Zod (rechaza datos inválidos antes de tocar la DB)
- **Errores operacionales** separados de errores de programación
- **Logging con redacción** automática de passwords y headers de auth

## 📐 Principios de diseño aplicados

- **Clean Architecture**: domain no depende de infrastructure ni de Express
- **Dependency Inversion**: controllers dependen de use cases (interfaces), no de Prisma
- **Repository pattern**: abstracción de persistencia para testabilidad
- **Use cases**: una clase por caso de uso (Single Responsibility)
- **DTOs validados**: Zod infiere tipos de los esquemas, evitando drift
- **Error handling centralizado**: jerarquía `AppError` con códigos y status HTTP
- **Inmutabilidad**: datos validados se reasignan al request, no se mutan fuera de lugar

## 🌐 Variables de entorno

Ver [`.env.example`](.env.example). Variables clave:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://koda:koda_secret@localhost:5432/kodaback?schema=public
JWT_SECRET=<mínimo 32 caracteres>
JWT_REFRESH_SECRET=<mínimo 32 caracteres, distinto al anterior>
BCRYPT_ROUNDS=10
```

## 📦 Despliegue

```bash
npm run build
NODE_ENV=production node dist/server.js
```

En producción, asegúrate de:
1. Cambiar `JWT_SECRET` y `JWT_REFRESH_SECRET` por valores seguros generados (`openssl rand -hex 32`)
2. Configurar `CORS_ORIGIN` con el dominio del frontend
3. Usar una base de datos administrada o ajustar `DATABASE_URL`
4. Configurar `LOG_PRETTY=false`

## 📄 Licencia

MIT