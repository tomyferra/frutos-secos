import { useState, useMemo, useCallback } from "react"
import { useProductos, useMixes, useCompras } from "@/lib/store"
import { formatearDinero, formatearPeso, calcularCostoMixKg } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Calculator, TrendingUp, DollarSign, Package, AlertTriangle, RotateCcw, ClipboardList, Percent, ShoppingBag, Layers } from "lucide-react"

function redondearMedio(v: number): number {
  return Math.round(v * 2) / 2
}

interface IngredientePlan {
  nombre: string
  porcentaje: number
  stockInicial: number
  necesarioKg: number
  stockFinal: number
}

interface MixPlan {
  mixId: string
  mixNombre: string
  kgMax: number
  detalle: IngredientePlan[]
  precioVentaKg: number
  costoKg: number
}

export default function Planificar() {
  const { productos, loading: loadProd } = useProductos()
  const { mixes, loading: loadMix } = useMixes()
  const { compras, loading: loadComp } = useCompras()

  const planes = useMemo((): MixPlan[] => {
    return mixes.map((mix) => {
      const kgMax = redondearMedio(Math.min(
        ...mix.ingredientes.map((ing) => {
          const prod = productos.find((p) => p.id === ing.productoId)
          if (!prod) return 0
          const ratio = ing.porcentaje / 100
          return ratio > 0 ? prod.stockKg / ratio : Infinity
        })
      ))

      const costoKg = calcularCostoMixKg(mix.ingredientes, compras)

      return {
        mixId: mix.id,
        mixNombre: mix.nombre,
        kgMax,
        detalle: [],
        precioVentaKg: mix.precioVentaKg,
        costoKg,
      }
    })
  }, [mixes, productos, compras])

  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})

  const [prodCantidades, setProdCantidades] = useState<Record<string, number>>({})
  const [prodPrecios, setProdPrecios] = useState<Record<string, string>>({})

  const costoPromedioKg = useCallback((productoId: string) => {
    const comprasProd = compras.filter((c) => c.productoId === productoId)
    const totalKg = comprasProd.reduce((s, c) => s + c.cantidadKg, 0)
    const totalCosto = comprasProd.reduce((s, c) => s + c.costoTotal, 0)
    return totalKg > 0 ? totalCosto / totalKg : 0
  }, [compras])

  const validar = (mixId: string, kg: number, pendientes: Record<string, number>) => {
    const mix = mixes.find((m) => m.id === mixId)
    if (!mix) return true
    for (const ing of mix.ingredientes) {
      const prod = productos.find((p) => p.id === ing.productoId)
      if (!prod) continue
      const necesario = kg * (ing.porcentaje / 100)
      const consumido = Object.entries(pendientes)
        .filter(([id]) => id !== mixId)
        .reduce((s, [id, k]) => {
          const otroMix = mixes.find((m) => m.id === id)
          if (!otroMix) return s
          const otroIng = otroMix.ingredientes.find((i) => i.productoId === ing.productoId)
          return otroIng ? s + k * (otroIng.porcentaje / 100) : s
        }, 0)
      if (consumido + necesario > prod.stockKg + 0.01) return false
    }
    return true
  }

  const handleChange = (mixId: string, raw: string) => {
    const val = parseFloat(raw)
    if (isNaN(val) || val < 0) {
      setCantidades((prev) => ({ ...prev, [mixId]: 0 }))
      setErrores((prev) => ({ ...prev, [mixId]: "" }))
      return
    }
    const redondeado = redondearMedio(val)

    if (redondeado <= 0) {
      setCantidades((prev) => ({ ...prev, [mixId]: 0 }))
      setErrores((prev) => ({ ...prev, [mixId]: "" }))
      return
    }

    setCantidades((prev) => {
      const pending = { ...prev, [mixId]: redondeado }
      const ok = validar(mixId, redondeado, pending)
      setErrores((e) => ({ ...e, [mixId]: ok ? "" : "Stock insuficiente" }))
      return pending
    })
  }

  const calcular = (plan: MixPlan) => {
    const kg = cantidades[plan.mixId] || 0

    const mix = mixes.find((m) => m.id === plan.mixId)
    const detalle: IngredientePlan[] = mix
      ? mix.ingredientes.map((ing) => {
          const prod = productos.find((p) => p.id === ing.productoId)
          const necesarioKg = kg * (ing.porcentaje / 100)
          return {
            nombre: prod?.nombre ?? "?",
            porcentaje: ing.porcentaje,
            stockInicial: prod?.stockKg ?? 0,
            necesarioKg,
            stockFinal: prod ? prod.stockKg - necesarioKg : 0,
          }
        })
      : []

    const costoTotal = kg * plan.costoKg
    const ingresoTotal = kg * plan.precioVentaKg
    const gananciaTotal = ingresoTotal - costoTotal

    return { kg, detalle, costoTotal, ingresoTotal, gananciaTotal }
  }

  const resultados = useMemo(
    () => planes.map(calcular),
    [planes, cantidades]
  )

  const stockFinalProductos = useMemo(() => {
    const consumido: Record<string, number> = {}
    for (const p of productos) consumido[p.id] = 0

    for (let i = 0; i < planes.length; i++) {
      const kg = cantidades[planes[i].mixId] || 0
      if (kg <= 0) continue
      const mix = mixes.find((m) => m.id === planes[i].mixId)
      if (!mix) continue
      for (const ing of mix.ingredientes) {
        consumido[ing.productoId] = (consumido[ing.productoId] || 0) + kg * (ing.porcentaje / 100)
      }
    }

    for (const p of productos) {
      const kg = prodCantidades[p.id] || 0
      if (kg > 0) {
        consumido[p.id] = (consumido[p.id] || 0) + kg
      }
    }

    return productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      stockInicial: p.stockKg,
      consumido: consumido[p.id] || 0,
      stockFinal: p.stockKg - (consumido[p.id] || 0),
    }))
  }, [productos, planes, cantidades, mixes, prodCantidades])

  const prodResultados = useMemo(() => {
    return productos.map((p) => {
      const kg = prodCantidades[p.id] || 0
      const precioVenta = parseFloat(prodPrecios[p.id]) || 0
      const costoKg = costoPromedioKg(p.id)
      return {
        id: p.id,
        nombre: p.nombre,
        kg,
        precioVenta,
        totalVenta: kg * precioVenta,
        costoTot: kg * costoKg,
        ganancia: kg * (precioVenta - costoKg),
      }
    })
  }, [productos, prodCantidades, prodPrecios, costoPromedioKg])

  const totalIngresoMix = resultados.reduce((s, r) => s + r.ingresoTotal, 0)
  const totalCostoMix = resultados.reduce((s, r) => s + r.costoTotal, 0)
  const totalGananciaMix = resultados.reduce((s, r) => s + r.gananciaTotal, 0)

  const totalIngresoProd = prodResultados.reduce((s, r) => s + r.totalVenta, 0)
  const totalCostoProd = prodResultados.reduce((s, r) => s + r.costoTot, 0)
  const totalGananciaProd = prodResultados.reduce((s, r) => s + r.ganancia, 0)

  const totalIngreso = totalIngresoMix + totalIngresoProd
  const totalCosto = totalCostoMix + totalCostoProd
  const totalGanancia = totalGananciaMix + totalGananciaProd
  const margenGlobal = totalCosto > 0 ? (totalGanancia / totalCosto) * 100 : 0
  const hayError = Object.values(errores).some(Boolean)

  if (loadProd || loadMix || loadComp) return <Loading mensaje="Calculando plan..." />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planificar Producción</h2>
          <p className="text-muted-foreground">
            Elegí cuántos kg producir de cada mezcla
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCantidades({})
            setErrores({})
            setProdCantidades({})
            setProdPrecios({})
          }}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>

      {/* Resumen global */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearDinero(totalIngreso)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatearDinero(totalCosto)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margenGlobal >= 0 ? "text-green-600" : "text-destructive"}`}>
              {margenGlobal >= 0 ? "+" : ""}{margenGlobal.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGanancia >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatearDinero(totalGanancia)}
            </div>
            {hayError && (
              <p className="text-xs text-destructive mt-1">
                Revisá los errores de stock
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productos individuales */}
      {productos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold tracking-tight">Productos Individuales</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {productos.map((p) => {
              const kg = prodCantidades[p.id] || 0
              const precioVenta = parseFloat(prodPrecios[p.id]) || 0
              const costoKg = costoPromedioKg(p.id)
              const totalVenta = kg * precioVenta
              const totalCosto = kg * costoKg
              const ganancia = totalVenta - totalCosto
              const stockSuficiente = kg <= p.stockKg

              return (
                <Card key={p.id} className="min-w-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{p.nombre}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Stock: {formatearPeso(p.stockKg)}
                        </p>
                      </div>
                      {costoKg > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Costo: {formatearDinero(costoKg)}/kg
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Venta por kg ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={prodPrecios[p.id] || ""}
                          onChange={(e) =>
                            setProdPrecios((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          placeholder="Precio"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Cantidad (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prodCantidades[p.id] || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            setProdCantidades((prev) => ({
                              ...prev,
                              [p.id]: isNaN(val) || val < 0 ? 0 : val,
                            }))
                          }}
                          placeholder="0"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {!stockSuficiente && kg > 0 && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Stock insuficiente — disponible: {formatearPeso(p.stockKg)}
                      </div>
                    )}

                    {kg > 0 && precioVenta > 0 && stockSuficiente && (
                      <div className="rounded-md border border-green-200 bg-green-50 p-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Venta</span>
                          <span className="font-medium">{formatearDinero(totalVenta)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Costo</span>
                          <span className="font-medium">{formatearDinero(totalCosto)}</span>
                        </div>
                        <Separator className="my-1" />
                        <div className="flex justify-between text-xs font-bold text-green-700">
                          <span>Ganancia</span>
                          <span>{formatearDinero(ganancia)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Mezclas */}
      {planes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold tracking-tight">Mezclas</h3>
          </div>
          {planes.map((plan, i) => {
          const res = resultados[i]
          const error = errores[plan.mixId]
          const margen = plan.costoKg > 0
            ? ((plan.precioVentaKg - plan.costoKg) / plan.costoKg) * 100
            : 0

          return (
            <Card key={plan.mixId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{plan.mixNombre}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Máximo producible: {plan.kgMax} kg
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatearDinero(res.gananciaTotal)}
                    </div>
                    <Badge variant={margen >= 0 ? "default" : "destructive"} className="text-xs">
                      {margen >= 0 ? "+" : ""}{margen.toFixed(1)}% margen
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`kg-${plan.mixId}`}>Cantidad a producir (kg)</Label>
                    <Input
                      id={`kg-${plan.mixId}`}
                      type="number"
                      step="0.5"
                      min="0"
                      value={cantidades[plan.mixId] || ""}
                      onChange={(e) => handleChange(plan.mixId, e.target.value)}
                      placeholder="0"
                      className="w-40"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChange(plan.mixId, String(plan.kgMax))}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Máximo
                    </button>
                  </div>
                  {error && (
                    <div className="flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      {error}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Costo/kg</span>
                    <p className="font-medium">{formatearDinero(plan.costoKg)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Venta/kg</span>
                    <p className="font-medium">{formatearDinero(plan.precioVentaKg)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Costo total</span>
                    <p className="font-medium">{formatearDinero(res.costoTotal)}</p>
                  </div>
                </div>

                <Separator />

                {res.kg > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Stock de ingredientes</p>
                    <div className="space-y-2">
                      {res.detalle.map((ing) => (
                        <div key={ing.nombre} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{ing.nombre}</span>
                            <Badge variant="outline" className="text-xs">{ing.porcentaje}%</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">
                              Inicial: {formatearPeso(ing.stockInicial)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className={ing.stockFinal < 0 ? "text-destructive font-medium" : "text-green-600"}>
                              Final: {formatearPeso(Math.max(0, ing.stockFinal))}
                            </span>
                            <span className="text-muted-foreground">
                              (usan {formatearPeso(ing.necesarioKg)})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      {/* Resumen de stock de todos los productos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Stock Final por Producto</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stockFinalProductos.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.nombre}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Inicial: {formatearPeso(p.stockInicial)}
                  </span>
                  {p.consumido > 0 && (
                    <span className="text-muted-foreground">
                      − {formatearPeso(p.consumido)}
                    </span>
                  )}
                  <span className="text-muted-foreground">→</span>
                  <span className={p.stockFinal < 0.01 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                    {formatearPeso(Math.max(0, p.stockFinal))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
