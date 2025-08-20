export type AgencyBrand = {
  agencyName: string
  primaryColor: string
  logoUrl: string
}

export type GymRow = {
  gymId: string
  gymName: string
  gymSlug: string
  createdAt: string
  socials: {
    platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube'
    connected_at?: string
    profile_key?: string
    platform_username?: string
  }[]
  deliveredMTD: number
  approvedMTD: number
  approvalRatePct: number
  uploadsMTD: number
  scheduledMTD: number
}

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'youtube'

export type FilterState = {
  search: string
  platform: Platform | 'all'
  showMissingSocials: boolean
  showLowApproval: boolean
  showZeroDelivered: boolean
}

export type AgencyAdminResponse = {
  branding: AgencyBrand
  gyms: GymRow[]
  pagination: {
    total: number
    page: number
    perPage: number
  }
}
