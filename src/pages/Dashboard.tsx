import { useProductos, useVentas, useMixes } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatearDinero, formatearPeso } from "@/lib/types"
import { Loading } from "@/components/ui/loading"
import { Package, TrendingUp, DollarSign, AlertTriangle } from "lucide-react"
import { useMemo } from "react"

export default function Dashboard() {
  const { productos, loading: loadProd } = useProductos()
  const { ventas, loading: loadVentas } = useVentas()
  const { mixes, loading: loadMix } = useMixes()

  const stats = useMemo(() => {
    const totalVentas = ventas.reduce((s, v) => s + v.totalVenta, 0)
    const totalGanancia = ventas.reduce((s, v) => s + v.ganancia, 0)
    const ventasMes = ventas.filter(
      (v) => v.fecha >= new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
    )
    const gananciaMes = ventasMes.reduce((s, v) => s + v.ganancia, 0)
    const ventasHoy = ventas.filter((v) => v.fecha === new Date().toISOString().split("T")[0])
    const gananciaHoy = ventasHoy.reduce((s, v) => s + v.ganancia, 0)
    const ventaHoyTotal = ventasHoy.reduce((s, v) => s + v.totalVenta, 0)
    const stockBajo = productos.filter((p) => p.stockKg < 1)
    return { totalVentas, totalGanancia, gananciaMes, gananciaHoy, ventaHoyTotal, stockBajo }
  }, [ventas, productos])

  if (loadProd || loadVentas || loadMix) return <Loading mensaje="Cargando dashboard..." />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Resumen de tu negocio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos.length}</div>
            <p className="text-xs text-muted-foreground">En inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mezclas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mixes.length}</div>
            <p className="text-xs text-muted-foreground">Para la venta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearDinero(stats.ventaHoyTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Ganancia: {formatearDinero(stats.gananciaHoy)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatearDinero(stats.gananciaMes)}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 30 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.stockBajo.length}</div>
            <p className="text-xs text-muted-foreground">Productos con &lt;1 kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Últimas ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ventas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas registradas aún.</p>
            ) : (
              [...ventas]
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .slice(0, 5)
                .map((v) => {
                  const nombre = v.tipo === "producto"
                    ? v.productoNombre ?? "Producto eliminado"
                    : mixes.find((m) => m.id === v.mixId)?.nombre ?? "Mezcla eliminada"
                  return (
                    <div key={v.id} className="flex items-center justify-between border-b pb-2 text-sm">
                      <div>
                        <span className="font-medium">{nombre}</span>
                        <span className="text-muted-foreground ml-2">
                          {v.cantidad} {v.unidad}
                        </span>
                      </div>
                      <div className="text-right">
                        <div>{formatearDinero(v.totalVenta)}</div>
                        <div className="text-xs text-green-600">+{formatearDinero(v.ganancia)}</div>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock bajo */}
      {stats.stockBajo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.stockBajo.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.nombre}</span>
                  <span className="font-medium">{formatearPeso(p.stockKg)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
