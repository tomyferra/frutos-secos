import { useNavigate } from "react-router-dom"
import { useMixes, useProductos, useCompras } from "@/lib/store"
import { formatearDinero, calcularCostoMixKg } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { useMemo } from "react"

export default function Mezclas() {
  const navigate = useNavigate()
  const { mixes, loading: loadingMixes, eliminar } = useMixes()
  const { productos, loading: loadingProd } = useProductos()
  const { compras, loading: loadingCompras } = useCompras()

  const mixesConCosto = useMemo(
    () =>
      mixes.map((m) => ({
        ...m,
        costoKg: calcularCostoMixKg(m.ingredientes, compras),
      })),
    [mixes, productos, compras]
  )

  if (loadingMixes || loadingProd || loadingCompras)
    return <Loading mensaje="Cargando mezclas..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mezclas</h2>
          <p className="text-muted-foreground">
            Creá mixes personalizados combinando tus productos
          </p>
        </div>
        <Button onClick={() => navigate("/mezclas/nueva")}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Mezcla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tus Mezclas ({mixes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {mixes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay mezclas creadas aún.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/mezclas/nueva")}
              >
                <Plus className="h-4 w-4 mr-1" /> Crear primera mezcla
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mezcla</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead>Costo/kg</TableHead>
                  <TableHead>Precio Venta/kg</TableHead>
                  <TableHead>Margen</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mixesConCosto.map((m) => {
                  const margen =
                    m.costoKg > 0
                      ? ((m.precioVentaKg - m.costoKg) / m.costoKg) * 100
                      : 0
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nombre}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {m.ingredientes.map((ing) => {
                            const prod = productos.find(
                              (p) => p.id === ing.productoId
                            )
                            return (
                              <Badge key={ing.productoId} variant="secondary" className="text-xs">
                                {prod?.nombre ?? "?"} {ing.porcentaje}%
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatearDinero(m.costoKg)}
                      </TableCell>
                      <TableCell>{formatearDinero(m.precioVentaKg)}</TableCell>
                      <TableCell>
                        <Badge variant={margen >= 0 ? "default" : "destructive"}>
                          {margen >= 0 ? "+" : ""}
                          {margen.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/mezclas/${m.id}`)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/mezclas/${m.id}/editar`)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`¿Eliminar la mezcla "${m.nombre}"?`)) {
                                eliminar(m.id)
                              }
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
