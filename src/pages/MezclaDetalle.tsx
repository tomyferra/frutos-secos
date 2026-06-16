import { useParams, useNavigate } from "react-router-dom"
import { useMixes, useProductos, useCompras } from "@/lib/store"
import { formatearDinero, calcularCostoMixKg } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useMemo } from "react"
import { Loading } from "@/components/ui/loading"

export default function MezclaDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mixes, loading: loadMix, eliminar } = useMixes()
  const { productos, loading: loadProd } = useProductos()
  const { compras, loading: loadComp } = useCompras()

  const mix = mixes.find((m) => m.id === id)

  const costoKg = useMemo(
    () => calcularCostoMixKg(mix?.ingredientes ?? [], compras),
    [mix, productos, compras]
  )

  if (loadMix || loadProd || loadComp) return <Loading mensaje="Cargando..." />

  if (!mix) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Mezcla no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/mezclas")}>
          Volver a mezclas
        </Button>
      </div>
    )
  }

  const margen = costoKg > 0 ? ((mix.precioVentaKg - costoKg) / costoKg) * 100 : 0

  const handleEliminar = () => {
    if (confirm(`¿Eliminar la mezcla "${mix.nombre}" permanentemente?`)) {
      eliminar(mix.id)
      navigate("/mezclas")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mezclas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{mix.nombre}</h2>
            <Badge>Mezcla</Badge>
          </div>
          <p className="text-muted-foreground">
            {mix.ingredientes.length} ingredientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/mezclas/${mix.id}/editar`)}>
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="destructive" onClick={handleEliminar}>
            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Costo por kg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {formatearDinero(costoKg)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Precio Venta / kg</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatearDinero(mix.precioVentaKg)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Margen</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${margen >= 0 ? "text-green-600" : "text-destructive"}`}
            >
              {margen >= 0 ? "+" : ""}
              {margen.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ingredientes */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mix.ingredientes.map((ing) => {
            const prod = productos.find((p) => p.id === ing.productoId)
            const comprasProd = compras.filter((c) => c.productoId === ing.productoId)
            const totalKg = comprasProd.reduce((s, c) => s + c.cantidadKg, 0)
            const totalCosto = comprasProd.reduce((s, c) => s + c.costoTotal, 0)
            const costoPromedioKg = totalKg > 0 ? totalCosto / totalKg : 0

            return (
              <div key={ing.productoId}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{prod?.nombre ?? "Producto eliminado"}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {formatearDinero(costoPromedioKg)} / kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg">{ing.porcentaje}%</span>
                    <div className="text-xs text-muted-foreground">
                      {formatearDinero(costoPromedioKg * (ing.porcentaje / 100))} / kg
                    </div>
                  </div>
                </div>
                {/* Barrita del % */}
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${ing.porcentaje}%` }}
                  />
                </div>
              </div>
            )
          })}

          <Separator />

          <div className="flex justify-between font-bold">
            <span>Costo total por kg</span>
            <span>{formatearDinero(costoKg)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
