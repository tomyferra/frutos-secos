import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"
import Dashboard from "@/pages/Dashboard"
import Productos from "@/pages/Productos"
import NuevoProducto from "@/pages/NuevoProducto"
import ProductoDetalle from "@/pages/ProductoDetalle"
import EditarProducto from "@/pages/EditarProducto"
import Compras from "@/pages/Compras"
import NuevaVenta from "@/pages/NuevaVenta"
import Ventas from "@/pages/Ventas"
import Mezclas from "@/pages/Mezclas"
import NuevaMezcla from "@/pages/NuevaMezcla"
import MezclaDetalle from "@/pages/MezclaDetalle"
import Planificar from "@/pages/Planificar"
import PnL from "@/pages/PnL"

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-background">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/productos/nuevo" element={<NuevoProducto />} />
            <Route path="/productos/:id" element={<ProductoDetalle />} />
            <Route path="/productos/:id/editar" element={<EditarProducto />} />
            <Route path="/planificar" element={<Planificar />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/ventas/nueva" element={<NuevaVenta />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/mezclas" element={<Mezclas />} />
            <Route path="/mezclas/nueva" element={<NuevaMezcla />} />
            <Route path="/mezclas/:id" element={<MezclaDetalle />} />
            <Route path="/mezclas/:id/editar" element={<NuevaMezcla />} />
            <Route path="/pnl" element={<PnL />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
