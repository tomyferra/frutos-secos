import { useState, useCallback, useEffect } from 'react'
import type { Producto, Compra, Venta, Mix, Gasto } from './types'

const API_BASE = 'http://localhost:3001/api'

async function cargar<T>(clave: string): Promise<T[]> {
  try {
    const res = await fetch(`${API_BASE}/${clave}`)
    const data = await res.json()
    return data[clave] ?? []
  } catch {
    return []
  }
}

function guardar<T>(clave: string, items: T[]) {
  fetch(`${API_BASE}/${clave}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
  }).catch(console.error)
}

// --- Productos ---

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar<Producto>('productos').then((data) => {
      setProductos(data)
      setLoading(false)
    })
  }, [])

  const guardarProductos = useCallback((items: Producto[]) => {
    setProductos(items)
    guardar('productos', items)
  }, [])

  const agregar = useCallback(
    (p: Producto) => guardarProductos([...productos, p]),
    [productos, guardarProductos]
  )

  const actualizar = useCallback(
    (id: string, data: Partial<Producto>) =>
      guardarProductos(
        productos.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        )
      ),
    [productos, guardarProductos]
  )

  const eliminar = useCallback(
    (id: string) => guardarProductos(productos.filter((p) => p.id !== id)),
    [productos, guardarProductos]
  )

  return { productos, loading, agregar, actualizar, eliminar }
}

// --- Compras ---

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar<Compra>('compras').then((data) => {
      setCompras(data)
      setLoading(false)
    })
  }, [])

  const guardarCompras = useCallback((items: Compra[]) => {
    setCompras(items)
    guardar('compras', items)
  }, [])

  const agregar = useCallback(
    (c: Compra) => guardarCompras([...compras, c]),
    [compras, guardarCompras]
  )

  const eliminar = useCallback(
    (id: string) => guardarCompras(compras.filter((c) => c.id !== id)),
    [compras, guardarCompras]
  )

  const porProducto = useCallback(
    (productoId: string) => compras.filter((c) => c.productoId === productoId),
    [compras]
  )

  return { compras, loading, agregar, eliminar, porProducto }
}

// --- Ventas ---

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar<Venta>('ventas').then((data) => {
      setVentas(data)
      setLoading(false)
    })
  }, [])

  const guardarVentas = useCallback((items: Venta[]) => {
    setVentas(items)
    guardar('ventas', items)
  }, [])

  const agregar = useCallback(
    (v: Venta) => guardarVentas([...ventas, v]),
    [ventas, guardarVentas]
  )

  const eliminar = useCallback(
    (id: string) => guardarVentas(ventas.filter((v) => v.id !== id)),
    [ventas, guardarVentas]
  )

  const porMix = useCallback(
    (mixId: string) => ventas.filter((v) => v.mixId === mixId),
    [ventas]
  )

  return { ventas, loading, agregar, eliminar, porMix }
}

// --- Mixes ---

export function useMixes() {
  const [mixes, setMixes] = useState<Mix[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar<Mix>('mixes').then((data) => {
      setMixes(data)
      setLoading(false)
    })
  }, [])

  const guardarMixes = useCallback((items: Mix[]) => {
    setMixes(items)
    guardar('mixes', items)
  }, [])

  const agregar = useCallback(
    (m: Mix) => guardarMixes([...mixes, m]),
    [mixes, guardarMixes]
  )

  const actualizar = useCallback(
    (id: string, data: Partial<Mix>) =>
      guardarMixes(
        mixes.map((m) =>
          m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
        )
      ),
    [mixes, guardarMixes]
  )

  const eliminar = useCallback(
    (id: string) => guardarMixes(mixes.filter((m) => m.id !== id)),
    [mixes, guardarMixes]
  )

  return { mixes, loading, agregar, actualizar, eliminar }
}

// --- Gastos ---

export function useGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar<Gasto>('gastos').then((data) => {
      setGastos(data)
      setLoading(false)
    })
  }, [])

  const guardarGastos = useCallback((items: Gasto[]) => {
    setGastos(items)
    guardar('gastos', items)
  }, [])

  const agregar = useCallback(
    (g: Gasto) => guardarGastos([...gastos, g]),
    [gastos, guardarGastos]
  )

  const eliminar = useCallback(
    (id: string) => guardarGastos(gastos.filter((g) => g.id !== id)),
    [gastos, guardarGastos]
  )

  return { gastos, loading, agregar, eliminar }
}
