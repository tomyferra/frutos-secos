import { useState, useMemo } from "react"
import { useVentas, useProductos, useMixes } from "@/lib/store"
import { formatearDinero } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Search, ArrowUpDown, Package } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Loading } from "@/components/ui/loading"

export default function Ventas() {
  const { ventas, loading: loadVtas, eliminar } = useVentas()
  const { productos, loading: loadProd, actualizar } = useProductos()
  const { mixes, loading: loadMixes } = useMixes()

  const [busqueda, setBusqueda] = useState("")
  const [orden, setOrden] = useState<"desc" | "asc">("desc")

  const totalGanancia = ventas.reduce((s, v) => s + v.ganancia, 0)
  const totalVentas = ventas.reduce((s, v) => s + v.totalVenta, 0)

  const nombreVenta = (v: typeof ventas[number]) => {
    if (v.tipo === "producto") return v.productoNombre ?? "Producto eliminado"
    const mix = mixes.find((m) => m.id === v.mixId)
    return mix?.nombre ?? "Mezcla eliminada"
  }

  const ventasFiltradas = useMemo(() => {
    const filtradas = ventas.filter((v) => {
      if (!busqueda) return true
      const nombre = nombreVenta(v)
      return nombre.toLowerCase().includes(busqueda.toLowerCase())
    })
    return [...filtradas].sort((a, b) =>
      orden === "desc" ? b.fecha.localeCompare(a.fecha) : a.fecha.localeCompare(b.fecha)
    )
  }, [ventas, busqueda, orden, mixes, productos])

  if (loadVtas || loadProd || loadMixes) return <Loading mensaje="Cargando ventas..." />

  const handleEliminar = (ventaId: string) => {
    if (!confirm("¿Eliminar esta venta? El stock se devolverá.")) return
    const venta = ventas.find((v) => v.id === ventaId)
    if (!venta) return

    if (venta.tipo === "mix") {
      const mix = mixes.find((m) => m.id === venta.mixId)
      if (mix) {
        for (const ing of mix.ingredientes) {
          const prod = productos.find((p) => p.id === ing.productoId)
          if (prod) {
            const restaurarKg = venta.cantidad * (ing.porcentaje / 100)
            actualizar(prod.id, { stockKg: prod.stockKg + restaurarKg })
          }
        }
      }
    } else {
      const prod = productos.find((p) => p.id === venta.productoId)
      if (prod) {
        actualizar(prod.id, { stockKg: prod.stockKg + venta.cantidad })
      }
    }

    eliminar(ventaId)
    toast({ title: "Venta eliminada", description: "Stock restaurado.", variant: "destructive" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Historial de Ventas</h2>
          <p className="text-muted-foreground">
            {ventas.length} ventas · Total: {formatearDinero(totalVentas)} · Ganancia:{' '}
            <span className="text-green-600 font-medium">{formatearDinero(totalGanancia)}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrden(orden === "desc" ? "asc" : "desc")}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {orden === "desc" ? "Más recientes" : "Más antiguas"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ventasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{ventas.length === 0 ? "No hay ventas registradas aún." : "Sin resultados para tu búsqueda."}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Total Venta</TableHead>
                  <TableHead>Ganancia</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasFiltradas.map((v) => {
                  const nombre = nombreVenta(v)
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs">{v.fecha}</TableCell>
                      <TableCell className="font-medium">{nombre}</TableCell>
                      <TableCell>
                        <Badge variant={v.tipo === "mix" ? "default" : "secondary"} className="text-xs">
                          {v.tipo === "mix" ? (
                            "Mezcla"
                          ) : (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" /> Producto
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {v.cantidad} {v.unidad}
                      </TableCell>
                      <TableCell>{formatearDinero(v.totalVenta)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={v.ganancia >= 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {v.ganancia >= 0 ? "+" : ""}
                          {formatearDinero(v.ganancia)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminar(v.id)}
                          title="Eliminar venta"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
