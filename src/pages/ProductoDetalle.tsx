import { useParams, useNavigate } from "react-router-dom"
import { useProductos, useCompras, useMixes } from "@/lib/store"
import { formatearDinero, formatearPeso, CATEGORIAS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { Loading } from "@/components/ui/loading"

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { productos, loading: loadProd, eliminar } = useProductos()
  const { loading: loadComp, porProducto: comprasPorProducto } = useCompras()
  const { mixes, loading: loadMixes } = useMixes()

  const producto = productos.find((p) => p.id === id)

  if (loadProd || loadComp || loadMixes) return <Loading mensaje="Cargando..." />

  if (!producto) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/productos")}>
          Volver a productos
        </Button>
      </div>
    )
  }

  const compras = comprasPorProducto(producto.id)
  const totalInvertido = compras.reduce((s, c) => s + c.costoTotal, 0)
  const totalKgComprados = compras.reduce((s, c) => s + c.cantidadKg, 0)
  const costoPromedio = totalKgComprados > 0 ? totalInvertido / totalKgComprados : 0
  const catLabel = CATEGORIAS.find((c) => c.value === producto.categoria)?.label ?? producto.categoria

  // Mixes que usan este producto
  const mixesConEste = useMemo(
    () => mixes.filter((m) => m.ingredientes.some((ing) => ing.productoId === producto.id)),
    [mixes, producto.id]
  )

  const handleEliminar = () => {
    if (confirm(`¿Eliminar "${producto.nombre}" permanentemente?`)) {
      eliminar(producto.id)
      navigate("/productos")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/productos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{producto.nombre}</h2>
            <Badge>{catLabel}</Badge>
          </div>
          <p className="text-muted-foreground">
            {formatearPeso(producto.stockKg)} en stock
            {costoPromedio > 0 && ` · Costo promedio: ${formatearDinero(costoPromedio)} / kg`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/productos/${producto.id}/editar`)}>
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="destructive" onClick={handleEliminar}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      </div>

      {/* KPIs del producto */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Invertido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearDinero(totalInvertido)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Stock Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearPeso(producto.stockKg)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Costo Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearDinero(costoPromedio)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compras">
        <TabsList>
          <TabsTrigger value="compras">Compras ({compras.length})</TabsTrigger>
          <TabsTrigger value="mixes">Usado en Mezclas ({mixesConEste.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="compras">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              {compras.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin compras registradas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo/kg</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Proveedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...compras]
                      .sort((a, b) => b.fecha.localeCompare(a.fecha))
                      .map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.fecha}</TableCell>
                          <TableCell>{formatearPeso(c.cantidadKg)}</TableCell>
                          <TableCell>{formatearDinero(c.costoKg)}</TableCell>
                          <TableCell>{formatearDinero(c.costoTotal)}</TableCell>
                          <TableCell>{c.proveedor || "-"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mixes">
          <Card>
            <CardHeader>
              <CardTitle>Mezclas que usan {producto.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              {mixesConEste.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este producto no se usa en ninguna mezcla aún.
                </p>
              ) : (
                <div className="space-y-3">
                  {mixesConEste.map((m) => {
                    const ing = m.ingredientes.find((i) => i.productoId === producto.id)
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <span className="font-medium">{m.nombre}</span>
                          <span className="text-muted-foreground ml-2 text-sm">
                            {ing?.porcentaje}% de la mezcla
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/mezclas/${m.id}`)}
                        >
                          Ver mezcla
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
