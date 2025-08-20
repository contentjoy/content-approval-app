'use client'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Platform } from '@/types/agency'
import { format } from 'date-fns'

interface SocialBadgesProps {
  socials: {
    platform: Platform
    connected_at?: string
    platform_username?: string
  }[]
}

const PLATFORM_CONFIG = {
  instagram: { label: 'Instagram', variant: 'default' },
  facebook: { label: 'Facebook', variant: 'secondary' },
  tiktok: { label: 'TikTok', variant: 'destructive' },
  youtube: { label: 'YouTube', variant: 'outline' }
} as const

const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as Platform[]

export function SocialBadges({ socials }: SocialBadgesProps) {
  const connectedPlatforms = socials.reduce((acc, social) => {
    acc[social.platform] = {
      connected_at: social.connected_at,
      platform_username: social.platform_username
    }
    return acc
  }, {} as Record<Platform, { connected_at?: string; platform_username?: string }>)

  const connectedSocials = ALL_PLATFORMS.filter(platform => platform in connectedPlatforms)

  if (connectedSocials.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No social connections
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connectedSocials.map((platform) => {
        const config = PLATFORM_CONFIG[platform]
        const connection = connectedPlatforms[platform]

        return (
          <Tooltip key={platform}>
            <TooltipTrigger>
              <Badge variant={config.variant}>
                {config.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p>{connection.platform_username || platform}</p>
                {connection.connected_at && (
                  <p className="text-xs text-muted-foreground">
                    Connected {format(new Date(connection.connected_at), 'MMM d, yyyy')}
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
