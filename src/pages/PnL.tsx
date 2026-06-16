import { useGastos, useVentas, useCompras, useProductos, useMixes } from "@/lib/store"
import { generarId, formatearDinero, hoy } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loading } from "@/components/ui/loading"
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
import { Trash2, DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { useMemo } from "react"

const schema = z.object({
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  monto: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
  cantidad: z.coerce.number().min(1, "La cantidad debe ser al menos 1"),
})

type FormData = z.infer<typeof schema>

export default function PnL() {
  const { gastos, loading: loadGastos, agregar: agregarGasto, eliminar: eliminarGasto } = useGastos()
  const { ventas, loading: loadVentas } = useVentas()
  const { compras, loading: loadCompras } = useCompras()
  const { productos, loading: loadProd } = useProductos()
  const { mixes, loading: loadMixes } = useMixes()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { descripcion: "", monto: 0, cantidad: 1 },
  })

  const monto = watch("monto")
  const cantidad = watch("cantidad")
  const totalGasto = monto * cantidad

  const resumen = useMemo(() => {
    const totalVentas = ventas.reduce((s, v) => s + v.totalVenta, 0)
    const totalCompras = compras.reduce((s, c) => s + c.costoTotal, 0)
    const totalGastos = gastos.reduce((s, g) => s + g.monto * g.cantidad, 0)
    const gananciaBruta = totalVentas - totalCompras
    const pnlNeto = gananciaBruta - totalGastos
    return { totalVentas, totalCompras, totalGastos, gananciaBruta, pnlNeto }
  }, [ventas, compras, gastos])

  const todasLasTransacciones = useMemo(() => {
    const items: {
      id: string
      fecha: string
      tipo: "compra" | "venta" | "gasto"
      descripcion: string
      ingreso: number
      egreso: number
    }[] = []

    for (const c of compras) {
      const prod = productos.find((p) => p.id === c.productoId)
      items.push({
        id: c.id,
        fecha: c.fecha,
        tipo: "compra",
        descripcion: `Compra: ${prod?.nombre ?? "—"} (${c.proveedor || "sin proveedor"})`,
        ingreso: 0,
        egreso: c.costoTotal,
      })
    }

    for (const v of ventas) {
      const nombre = v.tipo === "producto"
        ? v.productoNombre ?? "Producto eliminado"
        : mixes.find((m) => m.id === v.mixId)?.nombre ?? "Mezcla eliminada"
      items.push({
        id: v.id,
        fecha: v.fecha,
        tipo: "venta",
        descripcion: `Venta: ${nombre} (${v.cantidad} ${v.unidad})`,
        ingreso: v.totalVenta,
        egreso: 0,
      })
    }

    for (const g of gastos) {
      items.push({
        id: g.id,
        fecha: g.fecha,
        tipo: "gasto",
        descripcion: `Gasto: ${g.descripcion} (${g.cantidad}x ${formatearDinero(g.monto)})`,
        ingreso: 0,
        egreso: g.monto * g.cantidad,
      })
    }

    return items.sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [compras, ventas, gastos, productos, mixes])

  if (loadGastos || loadVentas || loadCompras || loadProd || loadMixes) {
    return <Loading mensaje="Cargando PnL..." />
  }

  const onSubmit = (data: FormData) => {
    agregarGasto({
      id: generarId(),
      descripcion: data.descripcion,
      monto: data.monto,
      cantidad: data.cantidad,
      fecha: hoy(),
    })
    toast({
      title: "Gasto registrado",
      description: `${data.descripcion} — ${formatearDinero(data.monto * data.cantidad)}`,
    })
    reset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">P&L — Pérdidas y Ganancias</h2>
        <p className="text-muted-foreground">Estado de resultados del negocio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos (Ventas)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatearDinero(resumen.totalVentas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Mercadería</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatearDinero(resumen.totalCompras)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
            <Wallet className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatearDinero(resumen.totalGastos)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Neto</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumen.pnlNeto >= 0 ? "text-green-600" : "text-red-600"}`}>
              {resumen.pnlNeto >= 0 ? "+" : ""}{formatearDinero(resumen.pnlNeto)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input {...register("descripcion")} placeholder="Ej: Bolsas para empaquetar" />
                {errors.descripcion && (
                  <p className="text-sm text-destructive">{errors.descripcion.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto por unidad ($)</Label>
                  <Input type="number" step="0.01" {...register("monto")} placeholder="500" />
                  {errors.monto && (
                    <p className="text-sm text-destructive">{errors.monto.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input type="number" step="1" {...register("cantidad")} placeholder="10" />
                  {errors.cantidad && (
                    <p className="text-sm text-destructive">{errors.cantidad.message}</p>
                  )}
                </div>
              </div>

              {monto > 0 && cantidad >= 1 && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">Total del gasto: </span>
                  {formatearDinero(totalGasto)}
                </div>
              )}

              <Button type="submit" className="w-full">
                Registrar Gasto
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ingresos (Ventas)</span>
              <span className="font-medium text-green-600">{formatearDinero(resumen.totalVentas)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Costo de Mercadería</span>
              <span className="font-medium text-red-600">-{formatearDinero(resumen.totalCompras)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ganancia Bruta</span>
              <span className={`font-medium ${resumen.gananciaBruta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {resumen.gananciaBruta >= 0 ? "+" : ""}{formatearDinero(resumen.gananciaBruta)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gastos Operativos</span>
              <span className="font-medium text-amber-600">-{formatearDinero(resumen.totalGastos)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-sm font-bold">
              <span>Resultado Neto</span>
              <span className={resumen.pnlNeto >= 0 ? "text-green-600" : "text-red-600"}>
                {resumen.pnlNeto >= 0 ? "+" : ""}{formatearDinero(resumen.pnlNeto)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Operaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {todasLasTransacciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay operaciones registradas aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ingreso</TableHead>
                  <TableHead className="text-right">Egreso</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todasLasTransacciones.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.fecha}</TableCell>
                    <TableCell className="font-medium">{t.descripcion}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.tipo === "venta"
                          ? "bg-green-100 text-green-700"
                          : t.tipo === "compra"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {t.tipo === "venta" ? "Venta" : t.tipo === "compra" ? "Compra" : "Gasto"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {t.ingreso > 0 ? formatearDinero(t.ingreso) : ""}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {t.egreso > 0 ? formatearDinero(t.egreso) : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.tipo === "gasto" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("¿Eliminar este gasto?")) {
                              eliminarGasto(t.id)
                              toast({ title: "Gasto eliminado", variant: "destructive" })
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
