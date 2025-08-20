'use client'

import { GymRow } from '@/types/agency'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { SocialBadges } from './social-badges'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'

interface GymsTableProps {
  gyms: GymRow[]
  isLoading?: boolean
}

export function GymsTable({ gyms, isLoading }: GymsTableProps) {
  if (isLoading) {
    return <GymsTableSkeleton />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Gym</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Social Connections</TableHead>
          <TableHead className="text-right">Approved MTD</TableHead>
          <TableHead className="text-right">Delivered MTD</TableHead>
          <TableHead>Approval Rate</TableHead>
          <TableHead className="text-right">Uploads MTD</TableHead>
          <TableHead className="text-right">Scheduled MTD</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gyms.map((gym) => (
          <TableRow key={gym.gymId}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {gym.gymName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={\`/\${gym.gymSlug}\`}
                  className="font-medium hover:underline"
                >
                  {gym.gymName}
                </Link>
              </div>
            </TableCell>
            <TableCell>
              {format(new Date(gym.createdAt), 'MMM d, yyyy')}
            </TableCell>
            <TableCell>
              <SocialBadges socials={gym.socials} />
            </TableCell>
            <TableCell className="text-right">{gym.approvedMTD}</TableCell>
            <TableCell className="text-right">{gym.deliveredMTD}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress
                  value={gym.approvalRatePct}
                  className="h-2 w-[100px]"
                />
                <span className="text-sm text-muted-foreground w-[40px]">
                  {Math.round(gym.approvalRatePct)}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">{gym.uploadsMTD}</TableCell>
            <TableCell className="text-right">{gym.scheduledMTD}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link
                      href={\`/\${gym.gymSlug}\`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={\`/\${gym.gymSlug}/posts\`}>
                      View posts
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={\`/\${gym.gymSlug}/settings#socials\`}>
                      Reconnect socials
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
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
              animationDelay: \`\${i * 100}ms\`,
              opacity: 1 - i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
