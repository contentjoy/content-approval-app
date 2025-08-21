'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { AgencyBrand, GymRow, FilterState } from '@/types/agency'
import { startOfMonth } from 'date-fns'
import { Filters } from './components/filters'
import { GymsTable } from '@/app/admin/agency/[slug]/components/gyms-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const DEFAULT_FILTERS: FilterState = {
  search: '',
  platform: 'all',
  showMissingSocials: false,
  showLowApproval: false,
  showZeroDelivered: false,
  month: startOfMonth(new Date()).toISOString()
}

export default function AdminPage() {
  const { slug } = useParams()
  const [data, setData] = useState<{ branding: AgencyBrand; gyms: GymRow[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [month, setMonth] = useState(startOfMonth(new Date()).toISOString())
  const [platform, setPlatform] = useState('all')
  const { showToast } = useToast()

  const loadData = useCallback(async () => {
    try {
      console.log('🔍 Fetching data for slug:', slug)
      const apiUrl = `/api/admin/agency/${slug}/gyms?month=${month}&platform=${platform}`
      console.log('🔍 API URL:', apiUrl)
      
      const response = await fetch(apiUrl)
      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error:', response.status, errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ API Response:', result)
      
      setData(result)
      setIsLoading(false)
    } catch (error) {
      console.error('❌ Load data error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showToast({ type: 'error', title: 'Error', message: `Failed to load agency data: ${errorMessage}` })
      setIsLoading(false)
    }
  }, [slug, month, platform, showToast])

  useEffect(() => {
    let isMounted = true

    if (isMounted) {
      loadData()
    }

    return () => {
      isMounted = false
    }
  }, [loadData]) // Reload when filters change

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth)
    setIsLoading(true)
    loadData()
  }

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform)
    setIsLoading(true)
    loadData()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-lg border bg-card">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>

        <GymsTable gyms={[]} isLoading={true} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-semibold">No Data Available</h2>
          <p className="text-muted-foreground">
            Unable to load agency data. Please try again later or contact support if the issue persists.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    )
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
            className="gap-2 text-foreground"
          >
            <Link
              href={`/onboarding/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground"
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
            <CardTitle className="text-sm font-medium">Total Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gyms.reduce((sum, gym) => sum + gym.deliveredMTD, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
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

      {/* Gyms Table */}
      <GymsTable 
        gyms={gyms} 
        isLoading={isLoading}
        currentMonth={month}
        currentPlatform={platform}
        onMonthChange={handleMonthChange}
        onPlatformChange={handlePlatformChange}
      />
    </div>
  )
}