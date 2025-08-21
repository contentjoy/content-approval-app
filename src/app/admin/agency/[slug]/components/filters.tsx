'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FilterState, Platform } from '@/types/agency'
import { format, startOfMonth, subMonths } from 'date-fns'

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

interface FiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function Filters({ filters, onChange }: FiltersProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search gyms..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="w-full sm:w-[300px]"
        />
        <Select
          value={filters.month}
          onValueChange={(value) => updateFilter('month', value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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
          value={filters.platform}
          onValueChange={(value) => updateFilter('platform', value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.showMissingSocials ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter('showMissingSocials', !filters.showMissingSocials)}
          className={filters.showMissingSocials ? "bg-primary hover:bg-primary/90" : "hover:bg-surface"}
        >
          Missing Socials
        </Button>
        <Button
          variant={filters.showLowApproval ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter('showLowApproval', !filters.showLowApproval)}
          className={filters.showLowApproval ? "bg-primary hover:bg-primary/90" : "hover:bg-surface"}
        >
          Low Approval
        </Button>
        <Button
          variant={filters.showZeroDelivered ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter('showZeroDelivered', !filters.showZeroDelivered)}
          className={filters.showZeroDelivered ? "bg-primary hover:bg-primary/90" : "hover:bg-surface"}
        >
          Zero Delivered
        </Button>
      </div>
    </div>
  )
}
