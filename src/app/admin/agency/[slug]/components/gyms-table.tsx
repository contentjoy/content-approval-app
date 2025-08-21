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
import { CheckmarkIcon } from './checkmark-icon'
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
    <div className="relative w-full overflow-x-auto border rounded-lg">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Gym</TableHead>
            <TableHead className="w-[120px]">Created</TableHead>
            <TableHead className="w-[200px]">Social Connections</TableHead>
            <TableHead className="text-right w-[100px]">Delivered</TableHead>
            <TableHead className="text-right w-[100px]">Approved</TableHead>
            <TableHead className="text-right w-[150px]">Approval Rate</TableHead>
            <TableHead className="text-center w-[100px]">Uploaded</TableHead>
            <TableHead className="text-center w-[100px]">Scheduled</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {gyms.map((gym) => (
            <TableRow key={gym.gymId}>
              <TableCell className="w-[250px]">
                <Link
                  href={`/${gym.gymSlug}`}
                  className="font-medium hover:underline text-foreground"
                >
                  {gym.gymName}
                </Link>
              </TableCell>
              <TableCell className="w-[120px] whitespace-nowrap">
                {format(new Date(gym.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="w-[200px]">
                <SocialBadges socials={gym.socials} />
              </TableCell>
              <TableCell className="text-right w-[100px]">{gym.deliveredMTD}</TableCell>
              <TableCell className="text-right w-[100px]">{gym.approvedMTD}</TableCell>
              <TableCell className="text-right w-[150px]">
                <div className="flex items-center justify-end gap-2">
                  <Progress
                    value={gym.approvalRatePct}
                    className="h-2 w-[100px]"
                  />
                  <span className="text-sm text-muted-foreground w-[40px]">
                    {Math.round(gym.approvalRatePct)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-[100px]">
                <div className="flex justify-center">
                  <CheckmarkIcon active={gym.uploadsMTD > 0} />
                </div>
              </TableCell>
              <TableCell className="w-[100px]">
                <div className="flex justify-center">
                  <CheckmarkIcon active={gym.scheduledMTD > 0} />
                </div>
              </TableCell>
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
                        href={`/${gym.gymSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${gym.gymSlug}/posts`}>
                        View posts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${gym.gymSlug}/settings#socials`}>
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
    </div>
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
              animationDelay: `${i * 100}ms`,
              opacity: 1 - i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  )
}
