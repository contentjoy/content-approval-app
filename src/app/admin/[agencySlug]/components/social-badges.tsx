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
  instagram: { label: 'IG', icon: '📸' },
  facebook: { label: 'FB', icon: '👤' },
  tiktok: { label: 'TT', icon: '🎵' },
  youtube: { label: 'YT', icon: '🎥' }
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

  return (
    <ScrollArea className="w-[200px]">
      <div className="flex gap-2">
        {ALL_PLATFORMS.map((platform) => {
          const isConnected = platform in connectedPlatforms
          const config = PLATFORM_CONFIG[platform]
          const connection = connectedPlatforms[platform]

          return (
            <Tooltip key={platform}>
              <TooltipTrigger>
                <Badge
                  variant={isConnected ? "default" : "outline"}
                  className={isConnected ? "bg-brand hover:bg-brand/80" : ""}
                >
                  {config.icon} {config.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {isConnected ? (
                  <div className="text-sm">
                    <p>{connection.platform_username || platform}</p>
                    {connection.connected_at && (
                      <p className="text-xs text-muted-foreground">
                        Connected {format(new Date(connection.connected_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">Not connected</p>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </ScrollArea>
  )
}
