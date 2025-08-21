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
  instagram: { label: 'Instagram' },
  facebook: { label: 'Facebook' },
  tiktok: { label: 'TikTok' },
  youtube: { label: 'YouTube' }
} as const

const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG) as Platform[]

export function SocialBadges({ socials }: SocialBadgesProps) {
  // Filter out platforms that have a profile_key
  const connectedPlatforms = socials.filter(social => social.profile_key)

  if (connectedPlatforms.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No social connections
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {connectedPlatforms.map((social) => {
        const config = PLATFORM_CONFIG[social.platform]
        return (
          <Tooltip key={social.platform}>
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
                <p>{social.platform_username || social.platform}</p>
                {social.connected_at && (
                  <p className="text-xs text-muted-foreground">
                    Connected {format(new Date(social.connected_at), 'MMM d, yyyy')}
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
