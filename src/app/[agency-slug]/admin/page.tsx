'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AgencyAdminResponse, FilterState, GymRow } from '@/types/agency'
import { Filters } from './components/filters'
import { GymsTable } from './components/gyms-table'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { ArrowUpRight } from 'lucide-react'

const DEFAULT_FILTERS: FilterState = {
  search: '',
  platform: 'all',
  showMissingSocials: false,
  showLowApproval: false,
  showZeroDelivered: false
}

export default function AgencyAdminPage() {
  const { 'agency-slug': agencySlug } = useParams()
  const [data, setData] = useState<AgencyAdminResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const searchParams = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            searchParams.append(key, value.toString())
          }
        })

        const response = await fetch(
          \`/api/agency/\${agencySlug}/gyms?\${searchParams.toString()}\`
        )
        
        if (!response.ok) {
          throw new Error('Failed to load data')
        }

        const json = await response.json()
        setData(json)
      } catch (error) {
        toast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load agency data'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [agencySlug, filters, toast])

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {data?.branding.logoUrl && (
          <Link href={\`/\${agencySlug}/admin\`}>
            <Image
              src={data.branding.logoUrl}
              alt={data.branding.agencyName}
              width={150}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-semibold">
            {data?.branding.agencyName || 'Loading...'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data?.gyms.length} active gyms
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <Filters
          filters={filters}
          onChange={setFilters}
        />
      </Card>

      {/* Onboarding Button */}
      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          className="gap-2"
        >
          <Link
            href={`/${agencySlug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Onboarding Form
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Table */}
      <GymsTable
        gyms={data?.gyms || []}
        isLoading={isLoading}
      />
    </div>
  )
}
