import { useState, useMemo } from "react"
import { useMixes, useProductos, useCompras, useVentas } from "@/lib/store"
import {
  generarId,
  formatearDinero,
  formatearPeso,
  hoy,
  calcularCostoMixKg,
} from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Scale, AlertTriangle, Package } from "lucide-react"
import { Loading } from "@/components/ui/loading"

export default function NuevaVenta() {
  const { mixes, loading: loadMix } = useMixes()
  const { productos, loading: loadProd, actualizar } = useProductos()
  const { compras, loading: loadComp } = useCompras()
  const { agregar } = useVentas()

  const [tipo, setTipo] = useState<"mix" | "producto">("mix")
  const [mixId, setMixId] = useState("")
  const [productoId, setProductoId] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [cantidad, setCantidad] = useState("")

  const mix = mixes.find((m) => m.id === mixId)
  const producto = productos.find((p) => p.id === productoId)
  const cantidadNum = parseFloat(cantidad) || 0

  const costoPromedioKg = useMemo(() => {
    if (!producto) return 0
    const comprasProd = compras.filter((c) => c.productoId === producto.id)
    const totalKg = comprasProd.reduce((s, c) => s + c.cantidadKg, 0)
    const totalCosto = comprasProd.reduce((s, c) => s + c.costoTotal, 0)
    return totalKg > 0 ? totalCosto / totalKg : 0
  }, [producto, compras])

  const datosMix = useMemo(() => {
    if (!mix) return null
    const costoKg = calcularCostoMixKg(mix.ingredientes, compras)
    const verificacionStock = mix.ingredientes.map((ing) => {
      const prod = productos.find((p) => p.id === ing.productoId)
      const necesarioKg = cantidadNum * (ing.porcentaje / 100)
      return {
        productoId: ing.productoId,
        nombre: prod?.nombre ?? "?",
        porcentaje: ing.porcentaje,
        disponibleKg: prod?.stockKg ?? 0,
        necesarioKg,
        suficiente: prod ? prod.stockKg >= necesarioKg : false,
      }
    })
    const totalVenta = cantidadNum * mix.precioVentaKg
    const costoVenta = cantidadNum * costoKg
    const ganancia = totalVenta - costoVenta
    const stockSuficiente = verificacionStock.every((v) => v.suficiente)
    return { costoKg, totalVenta, costoVenta, ganancia, verificacionStock, stockSuficiente }
  }, [mix, cantidadNum, productos, compras])

  const precioVentaNum = parseFloat(precioVenta) || 0
  const productoTotalVenta = cantidadNum * precioVentaNum
  const productoTotalCosto = cantidadNum * costoPromedioKg
  const productoGanancia = productoTotalVenta - productoTotalCosto
  const productoSuficiente = producto ? producto.stockKg >= cantidadNum : false

  if (loadMix || loadProd || loadComp) return <Loading mensaje="Cargando..." />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (cantidadNum <= 0) {
      toast({ title: "Error", description: "La cantidad debe ser mayor a 0.", variant: "destructive" })
      return
    }

    if (tipo === "mix") {
      if (!mix || !datosMix) return
      if (!datosMix.stockSuficiente) {
        toast({
          title: "Stock insuficiente",
          description: "No hay suficiente stock de uno o más ingredientes.",
          variant: "destructive",
        })
        return
      }

      const venta = {
        id: generarId(),
        tipo: "mix" as const,
        mixId: mix.id,
        cantidad: cantidadNum,
        unidad: "kg" as const,
        precioVentaKg: mix.precioVentaKg,
        totalVenta: datosMix.totalVenta,
        ganancia: datosMix.ganancia,
        fecha: hoy(),
      }

      agregar(venta)

      for (const ing of mix.ingredientes) {
        const prod = productos.find((p) => p.id === ing.productoId)
        if (prod) {
          const descontarKg = cantidadNum * (ing.porcentaje / 100)
          actualizar(prod.id, { stockKg: Math.max(0, prod.stockKg - descontarKg) })
        }
      }

      toast({
        title: "Venta registrada",
        description: `${cantidadNum} kg de "${mix.nombre}" — Ganancia: ${formatearDinero(datosMix.ganancia)}`,
      })
    } else {
      if (!producto) return
      if (precioVentaNum <= 0) {
        toast({ title: "Error", description: "Ingresá un precio de venta.", variant: "destructive" })
        return
      }
      if (!productoSuficiente) {
        toast({
          title: "Stock insuficiente",
          description: `Solo tenés ${formatearPeso(producto.stockKg)} disponibles.`,
          variant: "destructive",
        })
        return
      }

      const venta = {
        id: generarId(),
        tipo: "producto" as const,
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: cantidadNum,
        unidad: "kg" as const,
        precioVentaKg: precioVentaNum,
        totalVenta: productoTotalVenta,
        ganancia: productoGanancia,
        fecha: hoy(),
      }

      agregar(venta)
      actualizar(producto.id, { stockKg: Math.max(0, producto.stockKg - cantidadNum) })

      toast({
        title: "Venta registrada",
        description: `${cantidadNum} kg de "${producto.nombre}" — Ganancia: ${formatearDinero(productoGanancia)}`,
      })
    }

    setMixId("")
    setProductoId("")
    setCantidad("")
    setPrecioVenta("")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nueva Venta</h2>
        <p className="text-muted-foreground">Registrá la venta de una mezcla o producto suelto</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Registrar Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de venta */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Tabs value={tipo} onValueChange={(v) => setTipo(v as "mix" | "producto")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mix">Mezcla</TabsTrigger>
                  <TabsTrigger value="producto">
                    <Package className="h-4 w-4 mr-1" /> Producto suelto
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {tipo === "mix" ? (
              <>
                {/* Selección de mezcla */}
                <div className="space-y-2">
                  <Label>Mezcla</Label>
                  <Select value={mixId} onValueChange={setMixId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mezcla" />
                    </SelectTrigger>
                    <SelectContent>
                      {mixes.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nombre} — {formatearDinero(m.precioVentaKg)}/kg
                        </SelectItem>
                      ))}
                      {mixes.length === 0 && (
                        <SelectItem value="__none__" disabled>
                          No hay mezclas creadas
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {mix && datosMix && (
                  <>
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Precio venta</span>
                        <span className="font-medium">{formatearDinero(mix.precioVentaKg)} / kg</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Costo estimado</span>
                        <span className="font-medium">{formatearDinero(datosMix.costoKg)} / kg</span>
                      </div>
                      <Separator />
                      <div className="text-xs text-muted-foreground font-medium">Composición:</div>
                      {mix.ingredientes.map((ing) => {
                        const prod = productos.find((p) => p.id === ing.productoId)
                        return (
                          <div key={ing.productoId} className="flex justify-between text-xs">
                            <span>{prod?.nombre ?? "?"}</span>
                            <span>{ing.porcentaje}%</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Ej: 0.5"
                        autoFocus
                      />
                    </div>

                    {cantidadNum > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Verificación de stock</Label>
                        <div className="rounded-lg border p-3 space-y-2">
                          {datosMix.verificacionStock.map((v) => (
                            <div key={v.productoId} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2">
                                {!v.suficiente && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                                {v.nombre} ({v.porcentaje}%)
                              </span>
                              <span className={!v.suficiente ? "text-destructive font-medium" : ""}>
                                {formatearPeso(v.necesarioKg)} / {formatearPeso(v.disponibleKg)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {cantidadNum > 0 && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Venta</span>
                          <span>{formatearDinero(datosMix.totalVenta)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Costo total</span>
                          <span>{formatearDinero(datosMix.costoVenta)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-green-700">
                          <span>Ganancia</span>
                          <span>{formatearDinero(datosMix.ganancia)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {/* Selección de producto */}
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <Select value={productoId} onValueChange={setProductoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} ({formatearPeso(p.stockKg)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {producto && (
                  <>
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Producto</span>
                        <span className="font-medium">{producto.nombre}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Stock disponible</span>
                        <span className="font-medium">{formatearPeso(producto.stockKg)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Costo promedio</span>
                        <span className="font-medium">{formatearDinero(costoPromedioKg)} / kg</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Ej: 0.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio de venta por kg ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={precioVenta}
                        onChange={(e) => setPrecioVenta(e.target.value)}
                        placeholder="Ej: 15000"
                      />
                    </div>

                    {cantidadNum > 0 && precioVentaNum > 0 && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Venta</span>
                          <span>{formatearDinero(productoTotalVenta)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Costo total</span>
                          <span>{formatearDinero(productoTotalCosto)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-green-700">
                          <span>Ganancia</span>
                          <span>{formatearDinero(productoGanancia)}</span>
                        </div>
                      </div>
                    )}

                    {!productoSuficiente && cantidadNum > 0 && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        Stock insuficiente — disponible: {formatearPeso(producto.stockKg)}
                      </div>
                    )}
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    !producto || cantidadNum <= 0 || precioVentaNum <= 0 || !productoSuficiente
                  }
                >
                  <Scale className="h-5 w-5 mr-2" />
                  Registrar Venta
                </Button>
              </>
            )}

            {tipo === "mix" && (
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  !mix || !datosMix || cantidadNum <= 0 || !datosMix.stockSuficiente
                }
              >
                <Scale className="h-5 w-5 mr-2" />
                Registrar Venta
              </Button>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
