'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { AgencyBrand, GymRow, FilterState } from '@/types/agency'
import { Filters } from './components/filters'
import { GymsTable } from './components/gyms-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_FILTERS: FilterState = {
  search: '',
  platform: 'all',
  showMissingSocials: false,
  showLowApproval: false,
  showZeroDelivered: false
}

export default function AdminPage() {
  const { slug } = useParams()
  const [data, setData] = useState<{ branding: AgencyBrand; gyms: GymRow[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const { showToast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/admin/agency/${slug}/gyms`)
        if (!response.ok) {
          throw new Error('Failed to load data')
        }
        const result = await response.json()
        setData(result)
      } catch (error) {
        showToast({ type: 'error', title: 'Error', message: 'Failed to load agency data' })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [slug, showToast])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return <div>No data available</div>
  }

  const { branding, gyms } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {branding.logoUrl && (
            <img 
              src={branding.logoUrl} 
              alt={branding.agencyName}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{branding.agencyName}</h1>
            <p className="text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
        
        {/* Onboarding Button */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link
              href={`/onboarding/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Onboarding Form
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gyms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gyms.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Delivered MTD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gyms.reduce((sum, gym) => sum + gym.deliveredMTD, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved MTD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gyms.reduce((sum, gym) => sum + gym.approvedMTD, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(gyms.reduce((sum, gym) => sum + gym.approvalRatePct, 0) / gyms.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Filters filters={filters} onChange={setFilters} />

      {/* Gyms Table */}
      <GymsTable gyms={gyms} isLoading={isLoading} />
    </div>
  )
}