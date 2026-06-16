import { useNavigate } from "react-router-dom"
import { useProductos, useCompras } from "@/lib/store"
import { CATEGORIAS, generarId, hoy, type Categoria } from "@/lib/types"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { formatearDinero } from "@/lib/types"

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.string().min(1, "Seleccioná una categoría"),
  stockKg: z.coerce.number().min(0, "El stock no puede ser negativo"),
  costoKg: z.coerce.number().min(0, "El costo no puede ser negativo").optional(),
})

type FormData = z.infer<typeof schema>

export default function NuevoProducto() {
  const navigate = useNavigate()
  const { agregar } = useProductos()
  const { agregar: agregarCompra } = useCompras()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", categoria: "", stockKg: 0, costoKg: 0 },
  })

  const categoria = watch("categoria")
  const stockKg = watch("stockKg")
  const costoKg = watch("costoKg")

  const onSubmit = (data: FormData) => {
    const productoId = generarId()

    agregar({
      id: productoId,
      nombre: data.nombre,
      categoria: data.categoria as Categoria,
      stockKg: data.stockKg,
      createdAt: hoy(),
      updatedAt: hoy(),
    })

    // Si hay stock y costo, crear compra automática
    if (data.stockKg > 0 && (data.costoKg ?? 0) > 0) {
      agregarCompra({
        id: generarId(),
        productoId,
        cantidadKg: data.stockKg,
        costoKg: data.costoKg!,
        costoTotal: data.stockKg * data.costoKg!,
        proveedor: "Carga inicial",
        fecha: hoy(),
      })
    }

    const msg =
      data.stockKg > 0 && (data.costoKg ?? 0) > 0
        ? `${data.nombre} creado con ${data.stockKg} kg a ${formatearDinero(data.costoKg!)} / kg`
        : `${data.nombre} creado correctamente.`
    toast({ title: "Producto agregado", description: msg })
    navigate("/productos")
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Nuevo Producto</h2>
        <p className="text-muted-foreground">Agregá un producto a tu inventario</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto</Label>
              <Input id="nombre" {...register("nombre")} placeholder="Ej: Almendras" />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={categoria}
                onValueChange={(v) => setValue("categoria", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-destructive">{errors.categoria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockKg">Stock inicial (kg)</Label>
              <Input
                id="stockKg"
                type="number"
                step="0.1"
                {...register("stockKg")}
                placeholder="Ej: 5"
              />
              {errors.stockKg && (
                <p className="text-sm text-destructive">{errors.stockKg.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoKg">Precio de compra por kg ($)</Label>
              <Input
                id="costoKg"
                type="number"
                step="0.01"
                {...register("costoKg")}
                placeholder="Ej: 1500"
              />
              {errors.costoKg && (
                <p className="text-sm text-destructive">{errors.costoKg.message}</p>
              )}
              {stockKg > 0 && (costoKg ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total: {formatearDinero(stockKg * costoKg!)}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Guardar Producto</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/productos")}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
