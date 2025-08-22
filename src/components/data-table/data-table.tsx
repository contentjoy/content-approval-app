"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  VisibilityState,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTableViewOptions } from "./data-table-view-options";

// Sortable row wrapper (minimal)
function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  // Keep it simple: just render <TableRow> as-is; DnD context manages order externally.
  return <>{children}</>;
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // optional controlled reorder callback
  onReorder?: (newData: TData[]) => void;
  // optional minimum table width to trigger horizontal scroll
  minWidthClass?: string; // e.g., "min-w-[1100px]"
};

export function DataTable<TData extends { id?: string }, TValue>({
  columns,
  data,
  onReorder,
  minWidthClass = "min-w-[1100px]",
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<Record<string, number | string>>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onEnd",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // CSS variable sizing for performance
  const columnSizeVars = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const header of table.getFlatHeaders()) {
      vars[`--col-${header.id}-size`] = `${header.getSize()}px`;
    }
    return vars;
  }, [table.getState().columnSizing]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    // Map row order by index; only reorder if the consumer provided a callback
    const fromIndex = table.getRowModel().rows.findIndex(r => r.id === active.id);
    const toIndex = table.getRowModel().rows.findIndex(r => r.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    if (onReorder) {
      const newData = arrayMove(data, fromIndex, toIndex);
      onReorder(newData as TData[]);
    }
  }

  return (
    <div className="space-y-3">
      <DataTableToolbar table={table} />
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} rows
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <div className="w-full overflow-x-auto">
        <Table className={minWidthClass} style={columnSizeVars as React.CSSProperties}>
          <TableHeader className="sticky top-0 z-[1] bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative whitespace-nowrap text-xs uppercase text-muted-foreground"
                    style={{ width: `var(--col-${header.id}-size)` }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none"
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              // Using row ids; if absent, TanStack generates ids by index — fine for visual reorder
              items={table.getRowModel().rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <SortableRow key={row.id} id={row.id}>
                    <TableRow data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-4 py-3 text-sm"
                          style={{ width: `var(--col-${cell.column.id}-size)` }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  </SortableRow>
                ))}
              </TableBody>
            </SortableContext>
          </DndContext>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          className="inline-flex items-center rounded-[var(--radius)] border border-border px-3 py-2 text-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </button>
        <button
          className="inline-flex items-center rounded-[var(--radius)] border border-border px-3 py-2 text-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
