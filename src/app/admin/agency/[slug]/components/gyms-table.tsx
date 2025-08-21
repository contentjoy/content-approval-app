'use client'

import { GymRow } from '@/types/agency'
import { DataTable } from '@/components/ui/data-table/data-table'
import { columns } from './columns'

interface GymsTableProps {
  gyms: GymRow[]
  isLoading?: boolean
  currentMonth?: string
  currentPlatform?: string
  onMonthChange?: (month: string) => void
  onPlatformChange?: (platform: string) => void
}

export function GymsTable({ 
  gyms, 
  isLoading,
  currentMonth,
  currentPlatform,
  onMonthChange,
  onPlatformChange
}: GymsTableProps) {
  if (isLoading) {
    return <GymsTableSkeleton />
  }

  return (
    <DataTable 
      columns={columns} 
      data={gyms}
      currentMonth={currentMonth}
      currentPlatform={currentPlatform}
      onMonthChange={onMonthChange}
      onPlatformChange={onPlatformChange}
    />
  )
}

function GymsTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
                          <div className="h-5 w-[250px] bg-surface rounded animate-pulse" />
                <div className="h-4 w-[200px] bg-surface rounded animate-pulse" />
        </div>
      </div>
      <div className="border rounded-lg">
        <div className="h-12 border-b bg-surface" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 border-b last:border-0 animate-pulse bg-surface"
            style={{
              animationDelay: `${i * 100}ms`,
              opacity: 1 - i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  )
}