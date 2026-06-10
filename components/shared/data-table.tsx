import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { EmptyState } from './empty-state'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  className?: string
  render: (row: T) => React.ReactNode
}

function alignCls(a?: string) {
  return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'
}

export function DataTable<T>({
  columns, rows, getRowKey, empty, className,
}: {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  empty?: React.ReactNode
  className?: string
}) {
  if (rows.length === 0) {
    return <>{empty ?? <EmptyState title="Aucune donnée" />}</>
  }
  return (
    <div className={cn('overflow-hidden rounded-xl border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((c) => (
              <TableHead key={c.key} className={alignCls(c.align)}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((c) => (
                <TableCell key={c.key} className={cn(alignCls(c.align), c.className)}>{c.render(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
