# Maico — Instrucciones para Claude Code

## Descripción del proyecto

**Maico** es una aplicación web interna para empleados de una panadería homónima.
El objetivo es digitalizar y centralizar la gestión del negocio de forma escalable, arrancando con el módulo de producción y costos.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Auth | JWT con rotación de tokens |
| Validación | Zod |

---

## Estructura de carpetas esperada

```
Maico/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ingredients/      # Materia prima (ABM + precios)
│   │   │   ├── recipes/          # Recetario
│   │   │   └── calculator/       # Lógica de cálculo de costos
│   │   ├── auth/                 # JWT, middleware, roles
│   │   ├── common/               # Tipos compartidos, helpers, errores
│   │   └── index.ts              # Entry point
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/             # Llamadas al backend (fetch/axios)
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
├── CLAUDE.md
└── README.md
```

---

## Módulos del MVP (fase inicial)

### 1. Materia Prima (`/ingredients`)
- ABM de ingredientes
- Campos: nombre, unidad de medida (kg, g, l, ml, unidad), precio por unidad, fecha de actualización
- Historial de cambios de precios (para análisis futuros)

### 2. Recetario (`/recipes`)
- ABM de recetas
- Cada receta tiene: nombre, descripción, rendimiento (ej: "12 unidades"), y una lista de ingredientes con sus cantidades
- Relación many-to-many con ingredients

### 3. Calculadora (`/calculator`)
- Toma una receta como input
- Cruza los ingredientes de la receta con los precios actuales de materia prima
- Calcula: costo total de la receta, costo por unidad producida
- Permite agregar margen de ganancia para obtener precio de venta sugerido

---

## Estándares de código

- **TypeScript estricto** en todo el proyecto (`strict: true` en tsconfig)
- **Módulos desacoplados**: cada módulo tiene su router, controller, service y schema Zod propios
- **Manejo de errores centralizado** con middleware de Express
- **Variables de entorno** nunca hardcodeadas; usar `.env` con validación al inicio
- **Commits en inglés**, descriptivos y atómicos
- **Nombres en inglés** para código, variables y archivos

---

## Tarea inicial

Scaffoldear el proyecto completo con la estructura indicada arriba:

1. Inicializar `backend/` con Express + TypeScript + Prisma configurado para PostgreSQL
2. Inicializar `frontend/` con Vite + React + TypeScript
3. Crear el schema de Prisma con los modelos: `Ingredient`, `Recipe`, `RecipeIngredient`
4. Crear el módulo `ingredients` completo (router → controller → service → Zod schema)
5. Crear el módulo `recipes` completo
6. Crear el módulo `calculator` con la lógica de cálculo
7. Configurar auth básica con JWT (login, middleware de protección de rutas)
8. Actualizar el `README.md` con instrucciones para levantar el proyecto localmente

> La app es interna (solo empleados), por lo que no hace falta registro público. El admin crea los usuarios manualmente o via seed.
