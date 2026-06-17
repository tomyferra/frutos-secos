# FrutosSecos

Sistema de gestión de inventario y ventas para frutos secos. Aplicación web con React + TypeScript + Vite + Supabase.

## Funcionalidades

- **Productos** — CRUD de productos con categorías y stock en kg
- **Mezclas** — Creación de mezclas personalizadas con porcentajes de ingredientes y precio de venta
- **Compras** — Registro de entrada de stock con costo por kg y proveedor
- **Ventas** — Registro de ventas individuales y de mezclas con cálculo automático de ganancia
- **Planificar** — Planificación de producción basada en stock actual
- **P&L** — Estado de pérdidas y ganancias con ingresos, costos y gastos operativos

## Stack

- **Frontend:** React 19, TypeScript 6, Vite 8, Tailwind CSS, React Router, React Hook Form + Zod, Recharts
- **Backend:** Supabase (PostgreSQL, API REST, autenticación)
- **UI:** Radix UI primitives, Lucide icons, shadcn/ui components

## Setup

```bash
npm install
```

Copiar `.env` (pedir las variables a un compañero) y luego:

```bash
npm run dev          # Solo Vite (localhost:5173)
npm run build        # TypeScript check + build de producción
```

## Migración a Supabase

1. Crear las tablas ejecutando `supabase/migrations/00001_schema.sql` en el SQL Editor
2. Cargar datos iniciales con `supabase/seed.sql`

## Estructura

```
frutos-secos/
├── supabase/
│   ├── migrations/   # SQL de creación de tablas
│   └── seed.sql      # Datos iniciales
├── src/
│   ├── components/   # Componentes UI reutilizables
│   ├── hooks/        # Custom hooks (toast)
│   ├── lib/
│   │   ├── supabase.ts  # Cliente Supabase
│   │   ├── types.ts     # Tipos compartidos y utilidades
│   │   ├── store.ts     # Hooks de datos con Supabase
│   │   └── utils.ts     # Utilidades de Tailwind
│   └── pages/        # Páginas de la aplicación
└── public/
```
