'use client'

import { ColumnDef } from '@tanstack/react-table'
import { GymRow } from '@/types/agency'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { SocialBadges } from './social-badges'
import { CheckmarkIcon } from './checkmark-icon'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export const columns: ColumnDef<GymRow>[] = [
  {
    accessorKey: 'gymName',
    header: 'Gym',
    cell: ({ row }) => {
      return (
        <Link
          href={`/${row.original.gymSlug}`}
          className="font-medium hover:underline text-foreground"
        >
          {row.original.gymName}
        </Link>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    accessorKey: 'socials',
    header: 'Social Connections',
    cell: ({ row }) => <SocialBadges socials={row.original.socials} />,
  },
  {
    accessorKey: 'deliveredMTD',
    header: 'Delivered',
    cell: ({ row }) => (
      <div className="text-right">{row.original.deliveredMTD}</div>
    ),
  },
  {
    accessorKey: 'approvedMTD',
    header: 'Approved',
    cell: ({ row }) => (
      <div className="text-right">{row.original.approvedMTD}</div>
    ),
  },
  {
    accessorKey: 'approvalRatePct',
    header: 'Approval Rate',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        <Progress
          value={row.original.approvalRatePct}
          className="h-2 w-[100px] bg-foreground/10 [&>div]:bg-foreground [&>div]:rounded-full"
        />
        <span className="text-sm text-muted-foreground w-[40px]">
          {Math.round(row.original.approvalRatePct)}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'uploadsMTD',
    header: 'Uploaded',
    cell: ({ row }) => (
      <div className="flex justify-center">
        <CheckmarkIcon active={row.original.uploadsMTD > 0} />
      </div>
    ),
  },
  {
    accessorKey: 'scheduledMTD',
    header: 'Scheduled',
    cell: ({ row }) => (
      <div className="flex justify-center">
        <CheckmarkIcon active={row.original.scheduledMTD > 0} />
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
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
                href={`/${row.original.gymSlug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open portal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${row.original.gymSlug}/posts`}>
                View posts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${row.original.gymSlug}/settings#socials`}>
                Reconnect socials
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
