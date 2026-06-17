import { useState, useCallback, useEffect } from 'react'
import type { Producto, Compra, Venta, Mix, Gasto } from './types'
import { supabase } from './supabase'

// --- Productos ---

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('productos').select('*').order('nombre').then(({ data }) => {
      if (data) setProductos(data as Producto[])
      setLoading(false)
    })
  }, [])

  const agregar = useCallback(async (p: Producto) => {
    const { error } = await supabase.from('productos').insert(p)
    if (!error) setProductos((prev) => [...prev, p])
    return error
  }, [])

  const actualizar = useCallback(async (id: string, data: Partial<Producto>) => {
    const payload = { ...data, updatedAt: new Date().toISOString() }
    const { error } = await supabase.from('productos').update(payload).eq('id', id)
    if (!error) {
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...payload } : p))
      )
    }
    return error
  }, [])

  const eliminar = useCallback(async (id: string) => {
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) setProductos((prev) => prev.filter((p) => p.id !== id))
    return error
  }, [])

  return { productos, loading, agregar, actualizar, eliminar }
}

// --- Compras ---

export function useCompras() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('compras').select('*').order('fecha', { ascending: false }).then(({ data }) => {
      if (data) setCompras(data as Compra[])
      setLoading(false)
    })
  }, [])

  const agregar = useCallback(async (c: Compra) => {
    const { error } = await supabase.from('compras').insert(c)
    if (!error) setCompras((prev) => [c, ...prev])
    return error
  }, [])

  const eliminar = useCallback(async (id: string) => {
    const { error } = await supabase.from('compras').delete().eq('id', id)
    if (!error) setCompras((prev) => prev.filter((c) => c.id !== id))
    return error
  }, [])

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
    supabase.from('ventas').select('*').order('fecha', { ascending: false }).then(({ data }) => {
      if (data) setVentas(data as Venta[])
      setLoading(false)
    })
  }, [])

  const agregar = useCallback(async (v: Venta) => {
    const { error } = await supabase.from('ventas').insert(v)
    if (!error) setVentas((prev) => [v, ...prev])
    return error
  }, [])

  const eliminar = useCallback(async (id: string) => {
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (!error) setVentas((prev) => prev.filter((v) => v.id !== id))
    return error
  }, [])

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
    supabase.from('mixes').select('*').order('nombre').then(({ data }) => {
      if (data) setMixes(data as Mix[])
      setLoading(false)
    })
  }, [])

  const agregar = useCallback(async (m: Mix) => {
    const { error } = await supabase.from('mixes').insert(m)
    if (!error) setMixes((prev) => [...prev, m])
    return error
  }, [])

  const actualizar = useCallback(async (id: string, data: Partial<Mix>) => {
    const payload = { ...data, updatedAt: new Date().toISOString() }
    const { error } = await supabase.from('mixes').update(payload).eq('id', id)
    if (!error) {
      setMixes((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...payload } : m))
      )
    }
    return error
  }, [])

  const eliminar = useCallback(async (id: string) => {
    const { error } = await supabase.from('mixes').delete().eq('id', id)
    if (!error) setMixes((prev) => prev.filter((m) => m.id !== id))
    return error
  }, [])

  return { mixes, loading, agregar, actualizar, eliminar }
}

// --- Gastos ---

export function useGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('gastos').select('*').order('fecha', { ascending: false }).then(({ data }) => {
      if (data) setGastos(data as Gasto[])
      setLoading(false)
    })
  }, [])

  const agregar = useCallback(async (g: Gasto) => {
    const { error } = await supabase.from('gastos').insert(g)
    if (!error) setGastos((prev) => [g, ...prev])
    return error
  }, [])

  const eliminar = useCallback(async (id: string) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (!error) setGastos((prev) => prev.filter((g) => g.id !== id))
    return error
  }, [])

  return { gastos, loading, agregar, eliminar }
}
