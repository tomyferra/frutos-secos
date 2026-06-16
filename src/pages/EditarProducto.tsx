import { useParams, useNavigate } from "react-router-dom"
import { useProductos } from "@/lib/store"
import { CATEGORIAS, type Categoria } from "@/lib/types"
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

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.string().min(1, "Seleccioná una categoría"),
})

type FormData = z.infer<typeof schema>

export default function EditarProducto() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { productos, actualizar } = useProductos()

  const producto = productos.find((p) => p.id === id)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: producto
      ? { nombre: producto.nombre, categoria: producto.categoria }
      : undefined,
  })

  if (!producto) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/productos")}>
          Volver
        </Button>
      </div>
    )
  }

  const categoria = watch("categoria")

  const onSubmit = (data: FormData) => {
    actualizar(producto.id, {
      nombre: data.nombre,
      categoria: data.categoria as Categoria,
    })
    toast({ title: "Producto actualizado", description: `${data.nombre} modificado correctamente.` })
    navigate(`/productos/${producto.id}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Editar Producto</h2>
        <p className="text-muted-foreground">{producto.nombre}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del producto</Label>
              <Input id="nombre" {...register("nombre")} />
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
                  <SelectValue />
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

            <div className="flex gap-3 pt-2">
              <Button type="submit">Guardar Cambios</Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/productos/${producto.id}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
