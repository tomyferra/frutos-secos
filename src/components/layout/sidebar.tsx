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
  Menu,
  X,
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

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-background border shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "border-r bg-card flex flex-col gap-2 p-4",
          "fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-200 ease-in-out",
          "md:static md:translate-x-0 md:min-h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
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
              onClick={() => setIsOpen(false)}
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
    </>
  )
}
