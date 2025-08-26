"use client"

import { Button } from "@/components/ui/button"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GymRow } from "@/types/agency"
import { Table } from "@tanstack/react-table"

interface TableFiltersProps<TData> {
  table: Table<TData>
}

export function TableFilters<TData extends GymRow>({ table }: TableFiltersProps<TData>) {
  return (
    <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
      <TabsTrigger 
        value="all"
        onClick={() => table.getColumn("approvalRatePct")?.setFilterValue(undefined)}
      >
        All
      </TabsTrigger>
      <TabsTrigger 
        value="low-approval"
        onClick={() => {
          table.getColumn("approvalRatePct")?.setFilterValue((value: number) => value < 50)
        }}
      >
        Low Approval <Badge variant="secondary">{
          table.getFilteredRowModel().rows.filter(row => row.original.approvalRatePct < 50).length
        }</Badge>
      </TabsTrigger>
      <TabsTrigger 
        value="high-approval"
        onClick={() => {
          table.getColumn("approvalRatePct")?.setFilterValue((value: number) => value >= 50)
        }}
      >
        High Approval <Badge variant="secondary">{
          table.getFilteredRowModel().rows.filter(row => row.original.approvalRatePct >= 50).length
        }</Badge>
      </TabsTrigger>
      <TabsTrigger 
        value="scheduled"
        onClick={() => {
          const currentMonth = new Date().getMonth()
          table.getColumn("lastScheduleDate")?.setFilterValue((value: string) => {
            if (!value) return false
            return new Date(value).getMonth() === currentMonth
          })
        }}
      >
        Scheduled <Badge variant="secondary">{
          table.getFilteredRowModel().rows.filter(row => {
            if (!row.original.lastScheduleDate) return false
            return new Date(row.original.lastScheduleDate).getMonth() === new Date().getMonth()
          }).length
        }</Badge>
      </TabsTrigger>
      <TabsTrigger 
        value="not-scheduled"
        onClick={() => {
          const currentMonth = new Date().getMonth()
          table.getColumn("lastScheduleDate")?.setFilterValue((value: string) => {
            if (!value) return true
            return new Date(value).getMonth() !== currentMonth
          })
        }}
      >
        Not Scheduled <Badge variant="secondary">{
          table.getFilteredRowModel().rows.filter(row => {
            if (!row.original.lastScheduleDate) return true
            return new Date(row.original.lastScheduleDate).getMonth() !== new Date().getMonth()
          }).length
        }</Badge>
      </TabsTrigger>
    </TabsList>
  )
}
