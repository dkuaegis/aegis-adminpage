import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { AdminColumnMeta, AdminDataTableProps } from "./types";

export function AdminDataTable<TData>({
  columns,
  data,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  pageCount,
  totalElements,
  isLoading = false,
  loadingMessage = "데이터를 불러오는 중입니다.",
  emptyMessage = "조회 결과가 없습니다.",
  getRowId,
  onRowClick,
  rowClassName,
  meta,
}: AdminDataTableProps<TData>) {
  const safePageCount = Math.max(pageCount, 1);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    pageCount: safePageCount,
    getRowId,
    meta,
  });

  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnMeta = header.column.columnDef.meta as
                    | AdminColumnMeta
                    | undefined;

                  return (
                    <TableHead
                      key={header.id}
                      className={columnMeta?.headerClassName}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-2 font-medium",
                            columnMeta?.headerClassName?.includes(
                              "text-right"
                            ) && "ml-auto flex"
                          )}
                          onClick={() => header.column.toggleSorting()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <ArrowUp className="ml-2 size-4" />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ArrowDown className="ml-2 size-4" />
                          )}
                          {header.column.getIsSorted() === false && (
                            <ArrowUpDown className="ml-2 size-4" />
                          )}
                        </Button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columnCount}
                  className="h-16 text-center text-muted-foreground"
                >
                  {isLoading ? loadingMessage : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row.original)
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnMeta = cell.column.columnDef.meta as
                      | AdminColumnMeta
                      | undefined;

                    return (
                      <TableCell
                        key={cell.id}
                        className={columnMeta?.cellClassName}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          총 {totalElements ?? rows.length}건 / {pagination.pageIndex + 1}페이지
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={isLoading || !table.getCanPreviousPage()}
          >
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={isLoading || !table.getCanNextPage()}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
