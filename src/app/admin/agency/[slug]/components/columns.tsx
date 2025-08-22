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
    size: 250,
    minSize: 200,
    maxSize: 400,
    enableResizing: true,
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
    size: 220,
    minSize: 180,
    maxSize: 320,
    enableResizing: true,
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM d, yyyy'),
  },
  {
    accessorKey: 'socials',
    header: 'Social Connections',
    size: 200,
    minSize: 150,
    maxSize: 300,
    enableResizing: true,
    cell: ({ row }) => <SocialBadges socials={row.original.socials} />,
    filterFn: (row, id, filterValue) => {
      const socials = row.getValue(id) as string[]
      return filterValue === 'all' || socials.includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: 'deliveredMTD',
    header: 'Delivered',
    size: 120,
    minSize: 100,
    maxSize: 150,
    enableResizing: true,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{row.original.deliveredMTD}</div>
    ),
  },
  {
    accessorKey: 'approvedMTD',
    header: 'Approved',
    size: 120,
    minSize: 100,
    maxSize: 150,
    enableResizing: true,
    cell: ({ row }) => (
      <div className="text-right whitespace-nowrap">{row.original.approvedMTD}</div>
    ),
  },
  {
    accessorKey: 'approvalRatePct',
    header: 'Approval Rate',
    size: 180,
    minSize: 150,
    maxSize: 220,
    enableResizing: true,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        <Progress
          value={row.original.approvalRatePct}
          className="h-2 w-[100px] bg-muted [&>div]:bg-primary [&>div]:rounded-full"
        />
        <span className="text-sm text-muted-foreground w-[40px]">
          {Math.round(row.original.approvalRatePct)}%
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'lastUploadDate',
    header: 'Last Upload',
    cell: ({ row }) => row.original.lastUploadDate 
      ? format(new Date(row.original.lastUploadDate), 'MMM d, yyyy')
      : '—',
    size: 200,
    minSize: 180,
    maxSize: 250,
    enableResizing: true,
  },
  {
    accessorKey: 'lastDeliveryDate',
    header: 'Last Delivery',
    cell: ({ row }) => row.original.lastDeliveryDate
      ? format(new Date(row.original.lastDeliveryDate), 'MMM d, yyyy')
      : '—',
    size: 200,
    minSize: 180,
    maxSize: 250,
    enableResizing: true,
  },
  {
    accessorKey: 'lastScheduleDate',
    header: 'Last Scheduled',
    cell: ({ row }) => row.original.lastScheduleDate
      ? format(new Date(row.original.lastScheduleDate), 'MMM d, yyyy')
      : '—',
    size: 200,
    minSize: 180,
    maxSize: 250,
    enableResizing: true,
  },
  {
    accessorKey: 'lastPostScheduled',
    header: 'Last Post',
    cell: ({ row }) => row.original.lastPostScheduled
      ? format(new Date(row.original.lastPostScheduled), 'MMM d, yyyy')
      : '—',
    size: 200,
    minSize: 180,
    maxSize: 250,
    enableResizing: true,
  },
  {
    id: 'actions',
    size: 50,
    minSize: 40,
    maxSize: 60,
    enableResizing: true,
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