'use client'

import { GymRow } from '@/types/agency'
import { DataTable } from '@/components/ui/data-table/data-table'
import { columns } from './columns'

interface GymsTableProps {
  gyms: GymRow[]
  isLoading?: boolean
}

export function GymsTable({ gyms, isLoading }: GymsTableProps) {
  if (isLoading) {
    return <GymsTableSkeleton />
  }

  return <DataTable columns={columns} data={gyms} />
}

function GymsTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-5 w-[250px] bg-muted rounded animate-pulse" />
          <div className="h-4 w-[200px] bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="border rounded-lg">
        <div className="h-12 border-b bg-muted/5" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 border-b last:border-0 animate-pulse"
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