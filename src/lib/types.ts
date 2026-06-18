export type Categoria = 'nueces' | 'semillas' | 'deshidratados' | 'otro'

export const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'nueces', label: 'Frutos Secos' },
  { value: 'semillas', label: 'Semillas' },
  { value: 'deshidratados', label: 'Fruta Deshidratada' },
  { value: 'otro', label: 'Otros' },
]

export interface Producto {
  id: string
  nombre: string
  categoria: Categoria
  stockKg: number
  precioVentaKg: number
  createdAt: string
  updatedAt: string
}

export interface Compra {
  id: string
  productoId: string
  cantidadKg: number
  costoKg: number
  costoTotal: number
  proveedor: string
  fecha: string
}

export interface MixIngrediente {
  productoId: string
  /** Porcentaje del mix (0-100). Ej: 50 = 50% */
  porcentaje: number
}

export interface Mix {
  id: string
  nombre: string
  ingredientes: MixIngrediente[]
  precioVentaKg: number
  createdAt: string
  updatedAt: string
}

export interface Gasto {
  id: string
  descripcion: string
  monto: number
  cantidad: number
  fecha: string
}

export interface Venta {
  id: string
  tipo: 'mix' | 'producto'
  mixId?: string
  productoId?: string
  productoNombre?: string
  cantidad: number
  unidad: 'kg' | 'g'
  precioVentaKg: number
  totalVenta: number
  ganancia: number
  fecha: string
}

export function generarId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function hoy(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatearPeso(kg: number): string {
  if (kg >= 1) return `${kg.toFixed(2)} kg`
  return `${(kg * 1000).toFixed(0)} g`
}

/** Calcula el costo por kg de un mix según el costo promedio de sus ingredientes */
export function calcularCostoMixKg(
  ingredientes: MixIngrediente[],
  compras: Compra[]
): number {
  let total = 0
  for (const ing of ingredientes) {
    const comprasProd = compras.filter((c) => c.productoId === ing.productoId)
    const totalKg = comprasProd.reduce((s, c) => s + c.cantidadKg, 0)
    const totalCosto = comprasProd.reduce((s, c) => s + c.costoTotal, 0)
    const costoPromedioKg = totalKg > 0 ? totalCosto / totalKg : 0
    total += costoPromedioKg * (ing.porcentaje / 100)
  }
  return total
}

export function formatearDinero(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(valor)
}
