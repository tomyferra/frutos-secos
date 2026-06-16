import { useProductos, useCompras } from "@/lib/store"
import { generarId, formatearDinero, formatearPeso, hoy } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loading } from "@/components/ui/loading"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from "lucide-react"

const schema = z.object({
  productoId: z.string().min(1, "Seleccioná un producto"),
  cantidadKg: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
  costoKg: z.coerce.number().min(0.01, "El costo debe ser mayor a 0"),
  proveedor: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function Compras() {
  const { productos, loading: loadProd, actualizar } = useProductos()
  const { compras, loading: loadComp, agregar, eliminar } = useCompras()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { productoId: "", cantidadKg: 0, costoKg: 0, proveedor: "" },
  })

  const productoId = watch("productoId")
  const cantidadKg = watch("cantidadKg")
  const costoKg = watch("costoKg")
  const costoTotal = cantidadKg * costoKg

  if (loadProd || loadComp) return <Loading mensaje="Cargando..." />

  const onSubmit = (data: FormData) => {
    const compra = {
      id: generarId(),
      productoId: data.productoId,
      cantidadKg: data.cantidadKg,
      costoKg: data.costoKg,
      costoTotal: data.cantidadKg * data.costoKg,
      proveedor: data.proveedor || "",
      fecha: hoy(),
    }
    agregar(compra)

    // Actualizar stock del producto
    const prod = productos.find((p) => p.id === data.productoId)
    if (prod) {
      actualizar(prod.id, { stockKg: prod.stockKg + data.cantidadKg })
    }

    toast({
      title: "Compra registrada",
      description: `${formatearPeso(data.cantidadKg)} agregados al stock.`,
    })
    reset()
  }

  const handleEliminar = (compraId: string) => {
    if (!confirm("¿Eliminar esta compra? El stock se descontará.")) return
    const compra = compras.find((c) => c.id === compraId)
    if (compra) {
      const prod = productos.find((p) => p.id === compra.productoId)
      if (prod) {
        actualizar(prod.id, { stockKg: Math.max(0, prod.stockKg - compra.cantidadKg) })
      }
      eliminar(compraId)
      toast({ title: "Compra eliminada", variant: "destructive" })
    }
  }

  const sortedCompras = [...compras].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Compras</h2>
        <p className="text-muted-foreground">Registrá la entrada de stock y sus costos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nueva Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Select value={productoId} onValueChange={(v) => setValue("productoId", v)}>
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
                {errors.productoId && (
                  <p className="text-sm text-destructive">{errors.productoId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad (kg)</Label>
                  <Input type="number" step="0.1" {...register("cantidadKg")} placeholder="5" />
                  {errors.cantidadKg && (
                    <p className="text-sm text-destructive">{errors.cantidadKg.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Costo por kg ($)</Label>
                  <Input type="number" step="0.01" {...register("costoKg")} placeholder="1500" />
                  {errors.costoKg && (
                    <p className="text-sm text-destructive">{errors.costoKg.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Proveedor (opcional)</Label>
                <Input {...register("proveedor")} placeholder="Ej: Distribuidora ABC" />
              </div>

              {cantidadKg > 0 && costoKg > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">Total de la compra: </span>
                  {formatearDinero(costoTotal)}
                </div>
              )}

              <Button type="submit" className="w-full">
                Registrar Compra
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedCompras.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay compras registradas aún.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cant.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCompras.map((c) => {
                    const prod = productos.find((p) => p.id === c.productoId)
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{c.fecha}</TableCell>
                        <TableCell className="font-medium">{prod?.nombre ?? "—"}</TableCell>
                        <TableCell>{formatearPeso(c.cantidadKg)}</TableCell>
                        <TableCell>{formatearDinero(c.costoTotal)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEliminar(c.id)}
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
    </div>
  )
}
