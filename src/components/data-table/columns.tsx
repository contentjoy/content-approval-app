"use client"

import { ColumnDef } from "@tanstack/react-table"
import { GymRow } from "@/types/agency"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { IconGripVertical, IconCircleCheckFilled, IconLoader } from "@tabler/icons-react"
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
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.socials.map(s => s.platform).join(", ")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.status === "Active"
      return (
        <Badge 
          variant="outline" 
          className={`px-1.5 flex items-center gap-1 ${
            isActive 
              ? "text-green-500 dark:text-green-400" 
              : "text-muted-foreground"
          }`}
        >
          {isActive ? (
            <IconCircleCheckFilled className="size-4 fill-green-500 dark:fill-green-400" />
          ) : (
            <IconLoader className="size-4" />
          )}
          {row.original.status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "lastUploadDate",
    header: "Last Upload",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.lastUploadDate ? format(new Date(row.original.lastUploadDate), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "lastDeliveryDate",
    header: "Last Delivery",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.lastDeliveryDate ? format(new Date(row.original.lastDeliveryDate), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "lastScheduleDate",
    header: "Last Scheduled",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.lastScheduleDate ? format(new Date(row.original.lastScheduleDate), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "lastPostScheduled",
    header: "Last Post",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {row.original.lastPostScheduled ? format(new Date(row.original.lastPostScheduled), "MMM d, yyyy") : "-"}
      </div>
    ),
  },
  {
    accessorKey: "approvalRatePct",
    header: "Approval Rate",
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.approvalRatePct}%
      </div>
    ),
  }
]
