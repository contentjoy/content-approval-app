'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Platform } from '@/types/agency'
import { format } from 'date-fns'

interface SocialBadgesProps {
  socials: {
    platform: Platform
    ayrshare_profiles?: string | null
  }[]
}

interface AyrshareProfile {
  profile_key: string
  connected_at: string
}

type AyrshareProfiles = {
  [key in Platform]?: AyrshareProfile
}

const PLATFORM_CONFIG = {
  instagram: { label: 'Instagram' },
  facebook: { label: 'Facebook' },
  tiktok: { label: 'TikTok' },
  youtube: { label: 'YouTube' }
} as const

const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as Platform[]

export function SocialBadges({ socials }: SocialBadgesProps) {
  // Parse ayrshare_profiles from the first social (they all have the same value)
  let connectedPlatforms: Platform[] = []
  let profiles: AyrshareProfiles = {}

  try {
    const ayrshareJson = socials[0]?.ayrshare_profiles
    if (ayrshareJson) {
      profiles = JSON.parse(ayrshareJson)
      connectedPlatforms = Object.keys(profiles) as Platform[]
    }
  } catch (e) {
    console.error('Error parsing ayrshare_profiles:', e)
  }

  if (connectedPlatforms.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No social connections
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connectedPlatforms.map((platform) => {
        const config = PLATFORM_CONFIG[platform]
        const profile = profiles[platform]
        return (
          <Tooltip key={platform}>
            <TooltipTrigger>
              <Badge 
                variant="outline"
                className="bg-surface hover:bg-surface/80 text-foreground"
              >
                {config.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p>{platform}</p>
                {profile?.connected_at && (
                  <p className="text-xs text-muted-foreground">
                    Connected {format(new Date(profile.connected_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
