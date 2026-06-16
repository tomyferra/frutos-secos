import { useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMixes, useProductos, useCompras } from "@/lib/store"
import { generarId, formatearDinero, calcularCostoMixKg, hoy } from "@/lib/types"
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
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2 } from "lucide-react"
import type { MixIngrediente } from "@/lib/types"

interface IngredienteForm {
  productoId: string
  porcentaje: number
}

export default function NuevaMezcla() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mixes, agregar, actualizar } = useMixes()
  const { productos } = useProductos()
  const { compras } = useCompras()

  const editando = id ? mixes.find((m) => m.id === id) : undefined

  const [nombre, setNombre] = useState(editando?.nombre ?? "")
  const [precioVentaKg, setPrecioVentaKg] = useState(editando?.precioVentaKg ?? 0)
  const [ingredientes, setIngredientes] = useState<IngredienteForm[]>(
    editando?.ingredientes.map((i) => ({ ...i })) ?? [
      { productoId: "", porcentaje: 0 },
    ]
  )

  const esEdicion = !!editando

  const productosDisponibles = useMemo(
    () => ingredientes.map((i) => i.productoId).filter(Boolean),
    [ingredientes]
  )

  const totalPorcentaje = useMemo(
    () => ingredientes.reduce((s, i) => s + (i.porcentaje || 0), 0),
    [ingredientes]
  )

  const costoMixKg = useMemo(
    () =>
      calcularCostoMixKg(
        ingredientes.filter((i) => i.productoId && i.porcentaje > 0) as MixIngrediente[],
        compras
      ),
    [ingredientes, productos, compras]
  )

  const margen =
    costoMixKg > 0 ? ((precioVentaKg - costoMixKg) / costoMixKg) * 100 : 0

  const agregarIngrediente = () => {
    setIngredientes([...ingredientes, { productoId: "", porcentaje: 0 }])
  }

  const actualizarIngrediente = (
    index: number,
    campo: keyof IngredienteForm,
    valor: string | number
  ) => {
    const nuevos = [...ingredientes]
    nuevos[index] = { ...nuevos[index], [campo]: valor }
    setIngredientes(nuevos)
  }

  const eliminarIngrediente = (index: number) => {
    if (ingredientes.length <= 1) return
    setIngredientes(ingredientes.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast({ title: "Error", description: "El nombre de la mezcla es obligatorio.", variant: "destructive" })
      return
    }

    const validos = ingredientes.filter((i) => i.productoId && i.porcentaje > 0)
    if (validos.length < 2) {
      toast({
        title: "Error",
        description: "La mezcla debe tener al menos 2 ingredientes con porcentaje > 0.",
        variant: "destructive",
      })
      return
    }

    if (Math.abs(totalPorcentaje - 100) > 0.5) {
      toast({
        title: "Error",
        description: `Los porcentajes deben sumar 100%. Actual: ${totalPorcentaje}%`,
        variant: "destructive",
      })
      return
    }

    const ingredientesFinal: MixIngrediente[] = validos.map((i) => ({
      productoId: i.productoId,
      porcentaje: i.porcentaje,
    }))

    if (esEdicion) {
      actualizar(editando.id, {
        nombre: nombre.trim(),
        ingredientes: ingredientesFinal,
        precioVentaKg,
      })
      toast({ title: "Mezcla actualizada", description: `${nombre} modificada correctamente.` })
      navigate(`/mezclas/${editando.id}`)
    } else {
      agregar({
        id: generarId(),
        nombre: nombre.trim(),
        ingredientes: ingredientesFinal,
        precioVentaKg,
        createdAt: hoy(),
        updatedAt: hoy(),
      })
      toast({ title: "Mezcla creada", description: `${nombre} agregada correctamente.` })
      navigate("/mezclas")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {esEdicion ? "Editar Mezcla" : "Nueva Mezcla"}
        </h2>
        <p className="text-muted-foreground">
          {esEdicion
            ? "Modificá los ingredientes de la mezcla"
            : "Combiná productos para crear una mezcla personalizada"}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Mezcla</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la mezcla</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Mix Energético"
              />
            </div>

            {/* Ingredientes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ingredientes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={agregarIngrediente}
                >
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {ingredientes.map((ing, idx) => {
                return (
                  <div key={idx} className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Producto
                      </Label>
                      <Select
                        value={ing.productoId}
                        onValueChange={(v) =>
                          actualizarIngrediente(idx, "productoId", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              disabled={
                                p.id !== ing.productoId &&
                                productosDisponibles.includes(p.id)
                              }
                            >
                              {p.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-28 space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        % del mix
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={ing.porcentaje || ""}
                          onChange={(e) =>
                            actualizarIngrediente(
                              idx,
                              "porcentaje",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="50"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          %
                        </span>
                      </div>
                    </div>

                    {ingredientes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mb-1"
                        onClick={() => eliminarIngrediente(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                )
              })}

              {/* Barra de progreso de porcentaje */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Total: {totalPorcentaje}%</span>
                  {totalPorcentaje !== 100 && (
                    <span
                      className={
                        totalPorcentaje > 100
                          ? "text-destructive"
                          : "text-amber-600"
                      }
                    >
                      {totalPorcentaje > 100
                        ? `Excede ${totalPorcentaje - 100}%`
                        : `Falta ${100 - totalPorcentaje}%`}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      totalPorcentaje === 100
                        ? "bg-green-500"
                        : totalPorcentaje > 100
                          ? "bg-destructive"
                          : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(totalPorcentaje, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Vista previa de la composición */}
            {ingredientes.filter((i) => i.productoId && i.porcentaje > 0).length >
              0 && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium">Composición de la mezcla</p>
                {ingredientes
                  .filter((i) => i.productoId && i.porcentaje > 0)
                  .map((ing) => {
                    const prod = productos.find(
                      (p) => p.id === ing.productoId
                    )
                    return (
                      <div
                        key={ing.productoId}
                        className="flex justify-between text-sm"
                      >
                        <span>{prod?.nombre ?? "?"}</span>
                        <span className="font-medium">{ing.porcentaje}%</span>
                      </div>
                    )
                  })}
                <div className="border-t pt-2 flex justify-between text-sm font-bold">
                  <span>Costo por kg</span>
                  <span>{formatearDinero(costoMixKg)}</span>
                </div>
              </div>
            )}

            {/* Precio de venta */}
            <div className="space-y-2">
              <Label htmlFor="precioVenta">Precio de venta por kg ($)</Label>
              <Input
                id="precioVenta"
                type="number"
                step="0.01"
                value={precioVentaKg || ""}
                onChange={(e) => setPrecioVentaKg(parseFloat(e.target.value) || 0)}
                placeholder="Ej: 3500"
              />
            </div>

            {/* Resumen final */}
            {costoMixKg > 0 && precioVentaKg > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Costo por kg</span>
                  <span>{formatearDinero(costoMixKg)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Precio de venta por kg</span>
                  <span>{formatearDinero(precioVentaKg)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-green-700">
                  <span>Margen de ganancia</span>
                  <span>
                    {margen >= 0 ? "+" : ""}
                    {margen.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit">
                {esEdicion ? "Guardar Cambios" : "Crear Mezcla"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/mezclas")}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
