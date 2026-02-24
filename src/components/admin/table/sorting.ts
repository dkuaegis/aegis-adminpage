import type { SortingState, Updater } from "@tanstack/react-table";
import { functionalUpdate } from "@tanstack/react-table";

import type { ColumnSortMap } from "./types";

export function createSortingState(
  columnId: string,
  desc = false
): SortingState {
  return [{ id: columnId, desc }];
}

export function normalizeSingleSorting(
  updater: Updater<SortingState>,
  current: SortingState,
  fallback: SortingState
): SortingState {
  const resolved = functionalUpdate(updater, current);
  const first = resolved[0];

  if (!first || !first.id) {
    return fallback;
  }

  return [{ id: first.id, desc: Boolean(first.desc) }];
}

export function serializeSortingState(
  sorting: SortingState,
  sortMap: ColumnSortMap,
  fallback: string
): string {
  const first = sorting[0];

  if (!first) {
    return fallback;
  }

  const sortKey = sortMap[first.id];
  if (!sortKey) {
    return fallback;
  }

  return `${sortKey},${first.desc ? "desc" : "asc"}`;
}
