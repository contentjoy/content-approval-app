"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  // pick a reasonable default column for global search
  const searchableColumn = table.getAllLeafColumns().find(c => typeof c.getFilterValue?.() !== "undefined") ?? table.getAllLeafColumns()[0];

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search…"
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="h-9 w-[260px]"
        />
        <Button variant="outline" size="sm" onClick={() => table.resetColumnFilters()}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
