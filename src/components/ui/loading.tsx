import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Loading({
  className,
  mensaje = "Cargando...",
}: {
  className?: string
  mensaje?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-muted-foreground gap-3",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">{mensaje}</p>
    </div>
  )
}
