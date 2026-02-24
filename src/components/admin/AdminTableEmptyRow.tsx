import { TableCell, TableRow } from "@/components/ui/table"

interface AdminTableEmptyRowProps {
  colSpan: number
  isLoading: boolean
  loadingMessage: string
  emptyMessage: string
}

export function AdminTableEmptyRow({
  colSpan,
  isLoading,
  loadingMessage,
  emptyMessage,
}: AdminTableEmptyRowProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-16 text-center text-muted-foreground">
        {isLoading ? loadingMessage : emptyMessage}
      </TableCell>
    </TableRow>
  )
}
