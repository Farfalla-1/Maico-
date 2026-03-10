# Maico

Sistema de gestión interna para panadería. MVP enfocado en producción y costos.

## Stack

- **Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend:** React + Vite + TypeScript

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # editar con tu conexión a PostgreSQL
npm run prisma:migrate  # crear tablas
npm run prisma:generate
npm run prisma:seed     # usuario admin + ingredientes de ejemplo
npm run dev             # http://localhost:3001
```

**Usuario seed:** `admin@maico.com` / `admin123`

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

El frontend proxea `/api` al backend automáticamente.

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login (email + password) |
| POST | /api/auth/refresh | Refrescar access token |
| GET | /api/ingredients | Listar ingredientes |
| GET | /api/ingredients/:id | Detalle de ingrediente |
| POST | /api/ingredients | Crear ingrediente |
| PUT | /api/ingredients/:id | Actualizar ingrediente |
| DELETE | /api/ingredients/:id | Eliminar ingrediente |
| GET | /api/recipes | Listar recetas |
| GET | /api/recipes/:id | Detalle de receta |
| POST | /api/recipes | Crear receta |
| PUT | /api/recipes/:id | Actualizar receta |
| DELETE | /api/recipes/:id | Eliminar receta |
| POST | /api/calculator/calculate | Calcular costo de receta |

Todas las rutas (excepto auth) requieren `Authorization: Bearer <token>`.
