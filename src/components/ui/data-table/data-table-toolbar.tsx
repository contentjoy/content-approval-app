'use client'

import { Table } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { DataTableViewOptions } from './data-table-view-options'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, startOfMonth, subMonths } from 'date-fns'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onMonthChange?: (month: string) => void
  onPlatformChange?: (platform: string) => void
  currentMonth?: string
  currentPlatform?: string
}

// Generate last 12 months for filter
const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const date = startOfMonth(subMonths(new Date(), i))
  return {
    value: date.toISOString(),
    label: format(date, 'MMMM yyyy')
  }
})

const PLATFORMS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' }
]

export function DataTableToolbar<TData>({
  table,
  onMonthChange,
  onPlatformChange,
  currentMonth = startOfMonth(new Date()).toISOString(),
  currentPlatform = 'all'
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter..."
          value={(table.getColumn('gymName')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('gymName')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Select
          value={currentMonth}
          onValueChange={onMonthChange}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={currentPlatform}
          onValueChange={onPlatformChange}
        >
          <SelectTrigger className="h-8 w-[150px]">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map((platform) => (
              <SelectItem key={platform.value} value={platform.value}>
                {platform.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
