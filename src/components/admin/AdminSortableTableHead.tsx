import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc";

interface AdminSortableTableHeadProps {
  title: string;
  sortKey: string;
  sort: string;
  onSortChange: (nextSort: string) => void;
  className?: string;
  defaultDirection?: SortDirection;
}

export const AdminSortableTableHead = ({
  title,
  sortKey,
  sort,
  onSortChange,
  className,
  defaultDirection = "asc",
}: AdminSortableTableHeadProps) => {
  const [activeSortKey, activeDirection] = sort.split(",");
  const isActive = activeSortKey === sortKey;

  const nextDirection: SortDirection = !isActive
    ? defaultDirection
    : activeDirection === "asc"
      ? "desc"
      : "asc";

  const icon = !isActive ? (
    <ArrowUpDown className="ml-2 size-4" />
  ) : activeDirection === "asc" ? (
    <ArrowUp className="ml-2 size-4" />
  ) : (
    <ArrowDown className="ml-2 size-4" />
  );

  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-2 font-medium",
          className?.includes("text-right") && "ml-auto flex"
        )}
        onClick={() => onSortChange(`${sortKey},${nextDirection}`)}
      >
        {title}
        {icon}
      </Button>
    </TableHead>
  );
};
