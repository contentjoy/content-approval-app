"use client"

import { ColumnDef } from "@tanstack/react-table"
import { GymRow } from "@/types/agency"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { IconGripVertical, IconCircleCheckFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-move"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

export const columns: ColumnDef<GymRow>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "gymName",
    header: "Gym Name",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.original.gymName}
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "socials",
    header: "Social Connections",
    cell: ({ row }) => {
      // Parse ayrshare_profiles to get connected platforms
      let connectedPlatforms: string[] = []
      try {
        const profiles = row.original.socials.reduce((acc: Record<string, any>, social) => {
          if (social.platform && social.ayrshare_profiles) {
            const profileData = typeof social.ayrshare_profiles === 'string' 
              ? JSON.parse(social.ayrshare_profiles)
              : social.ayrshare_profiles
            
            if (profileData[social.platform]?.profile_key) {
              acc[social.platform] = profileData[social.platform]
            }
          }
          return acc
        }, {})
        
        connectedPlatforms = Object.keys(profiles)
      } catch (e) {
        console.error('Error parsing social profiles:', e)
      }

      return (
        <div className="flex flex-wrap gap-1">
          {connectedPlatforms.map((platform) => (
            <Badge 
              key={platform}
              variant="outline" 
              className="capitalize px-1.5 text-xs"
            >
              {platform}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.status === "Active"
      return (
        <div className="flex items-center gap-2">
          {isActive ? (
            <IconCircleCheckFilled className="text-green-500 dark:text-green-400 size-4" />
          ) : null}
          <span className={isActive ? "text-green-500 dark:text-green-400" : "text-muted-foreground"}>
            {row.original.status}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "deliveredMTD",
    header: "Delivered",
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.deliveredMTD}
      </div>
    ),
  },
  {
    accessorKey: "approvedMTD",
    header: "Approved",
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.approvedMTD}
      </div>
    ),
  },
  {
    accessorKey: "lastUploadDate",
    header: "Last Upload",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right">
        {row.original.lastUploadDate ? format(new Date(row.original.lastUploadDate), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "lastDeliveryDate",
    header: "Last Delivery",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right">
        {row.original.lastDeliveryDate ? format(new Date(row.original.lastDeliveryDate), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "lastScheduleDate",
    header: "Last Scheduled",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right">
        {row.original.lastScheduleDate ? format(new Date(row.original.lastScheduleDate), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "lastPostScheduled",
    header: "Last Post",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right">
        {row.original.lastPostScheduled ? format(new Date(row.original.lastPostScheduled), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "approvalRatePct",
    header: "Approval Rate",
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {Math.round(row.original.approvalRatePct)}%
      </div>
    ),
  }
]