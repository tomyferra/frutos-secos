# FrutosSecos

Sistema de gestión de inventario y ventas para frutos secos. Aplicación web con React + TypeScript + Vite y backend Express.

## Funcionalidades

- **Productos** — CRUD de productos con categorías y stock en kg
- **Mezclas** — Creación de mezclas personalizadas con porcentajes de ingredientes y precio de venta
- **Compras** — Registro de entrada de stock con costo por kg y proveedor
- **Ventas** — Registro de ventas individuales y de mezclas con cálculo automático de ganancia
- **Planificar** — Planificación de producción basada en stock actual
- **P&L** — Estado de pérdidas y ganancias con ingresos, costos y gastos operativos

## Stack

- **Frontend:** React 19, TypeScript 6, Vite 8, Tailwind CSS, React Router, React Hook Form + Zod, Recharts
- **Backend:** Express 5, Node.js
- **UI:** Radix UI primitives, Lucide icons, shadcn/ui components

## Comandos

```bash
npm run dev          # Inicia cliente y servidor (concurrently)
npm run dev:client   # Solo Vite (localhost:5173)
npm run dev:server   # Solo Express (localhost:3001)
npm run build        # TypeScript check + build de producción
npm run preview      # Preview del build
```

## Estructura

```
frutos-secos/
├── server/
│   ├── index.js        # Express API (CRUD sobre data.json)
│   └── data.json       # Persistencia en archivo
├── src/
│   ├── components/     # Componentes UI reutilizables
│   ├── hooks/          # Custom hooks (toast)
│   ├── lib/
│   │   ├── types.ts    # Tipos compartidos y utilidades
│   │   ├── store.ts    # Hooks de datos con fetch a API
│   │   └── utils.ts    # Utilidades de Tailwind
│   └── pages/          # Páginas de la aplicación
└── public/
```

Los datos se persisten en `server/data.json`. No requiere base de datos.
