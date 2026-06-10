import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function StatCard({
  label, value, hint, icon: Icon, accentClass, className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  accentClass?: string
  className?: string
}) {
  return (
    <Card className={cn('py-0', className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary', accentClass)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
