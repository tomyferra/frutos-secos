import { useNavigate } from "react-router-dom"
import { useProductos, useMixes } from "@/lib/store"
import { formatearPeso, CATEGORIAS } from "@/lib/types"
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
import { Loading } from "@/components/ui/loading"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { useMemo } from "react"

export default function Productos() {
  const { productos, loading, eliminar } = useProductos()
  const { mixes } = useMixes()
  const navigate = useNavigate()

  const labelCategoria = (cat: string) =>
    CATEGORIAS.find((c) => c.value === cat)?.label ?? cat

  // Para cada producto, mostrar en cuántos mixes se usa
  const usos = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const p of productos) map[p.id] = []
    for (const m of mixes) {
      for (const ing of m.ingredientes) {
        if (map[ing.productoId]) map[ing.productoId].push(m.nombre)
      }
    }
    return map
  }, [productos, mixes])

  if (loading) return <Loading mensaje="Cargando productos..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Productos</h2>
          <p className="text-muted-foreground">Gestiona tu inventario de ingredientes</p>
        </div>
        <Button onClick={() => navigate("/productos/nuevo")}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario ({productos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {productos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay productos registrados.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/productos/nuevo")}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar primer producto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Usado en</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((p) => {
                  const mixesDelProducto = usos[p.id] ?? []
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{labelCategoria(p.categoria)}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={p.stockKg < 1 ? "text-amber-600 font-medium" : ""}>
                          {formatearPeso(p.stockKg)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {mixesDelProducto.length === 0 ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {mixesDelProducto.map((nombre) => (
                              <Badge key={nombre} variant="outline" className="text-xs">
                                {nombre}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/productos/${p.id}`)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/productos/${p.id}/editar`)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`¿Eliminar "${p.nombre}"?`)) {
                                eliminar(p.id)
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
