import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";

import { QrCode } from "lucide-react";
import { useMemo } from "react";

import { AdminDataTable } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { EventRow } from "../hooks/useEventPageState";

interface EventTableSectionProps {
  isLoading: boolean;
  rows: EventRow[];
  sorting: SortingState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  totalPages: number;
  totalElements: number;
  onOpenEditDialog: (activityId: number) => Promise<void>;
  onDelete: (activityId: number) => Promise<void>;
  onOpenQR: (eventId: number) => void;
}

export const EventTableSection = ({
  isLoading,
  rows,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  totalPages,
  totalElements,
  onOpenEditDialog,
  onDelete,
  onOpenQR,
}: EventTableSectionProps) => {
  const columns = useMemo<ColumnDef<EventRow>[]>(() => {
    return [
      {
        id: "id",
        accessorKey: "id",
        header: "ID",
        enableSorting: true,
        meta: {
          headerClassName: "w-20 text-center",
          cellClassName: "text-center font-medium",
        },
      },
      {
        id: "name",
        accessorKey: "name",
        header: "행사 이름",
        enableSorting: true,
      },
      {
        id: "pointAmount",
        accessorKey: "amount",
        header: "포인트",
        enableSorting: true,
        meta: {
          headerClassName: "w-28 text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.amount}</Badge>
        ),
      },
      {
        id: "actions",
        header: "동작",
        meta: {
          headerClassName: "w-[320px] text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onOpenEditDialog(row.original.id)}
            >
              수정
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void onDelete(row.original.id)}
            >
              삭제
            </Button>
            <Button size="sm" onClick={() => onOpenQR(row.original.id)}>
              <QrCode className="size-4" />
              QR
            </Button>
          </div>
        ),
      },
    ];
  }, [onDelete, onOpenEditDialog, onOpenQR]);

  return (
    <Card>
      <CardContent className="p-0">
        <AdminDataTable
          columns={columns}
          data={rows}
          sorting={sorting}
          onSortingChange={onSortingChange}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          pageCount={totalPages}
          totalElements={totalElements}
          isLoading={isLoading}
          loadingMessage="데이터를 불러오는 중입니다."
          emptyMessage="조건에 맞는 행사가 없습니다."
          getRowId={(row) => String(row.id)}
        />
      </CardContent>
    </Card>
  );
};
