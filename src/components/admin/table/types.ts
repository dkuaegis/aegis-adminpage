import type {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  TableMeta,
  Updater,
} from "@tanstack/react-table";

export type ColumnSortMap = Record<string, string>;

export interface AdminDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  sorting: SortingState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  pageCount: number;
  totalElements?: number;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  meta?: TableMeta<TData>;
}

export interface AdminColumnMeta {
  headerClassName?: string;
  cellClassName?: string;
}
