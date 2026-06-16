import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  Layers,
  ClipboardList,
  BarChart3,
} from "lucide-react"

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/productos", label: "Productos", icon: Package },
  { to: "/mezclas", label: "Mezclas", icon: Layers },
  { to: "/planificar", label: "Planificar", icon: ClipboardList },
  { to: "/compras", label: "Compras", icon: TrendingUp },
  { to: "/ventas/nueva", label: "Nueva Venta", icon: PlusCircle },
  { to: "/ventas", label: "Historial Ventas", icon: ShoppingCart, end: true },
  { to: "/pnl", label: "P&L", icon: BarChart3 },
]

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4 flex flex-col gap-2">
      <div className="px-3 py-4 mb-4">
        <h1 className="text-xl font-bold text-primary">FrutosSecos</h1>
        <p className="text-xs text-muted-foreground">Gestión de Inventario</p>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
