"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ChartConfig = Record<string, { label: string; color: string }>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {}
    for (const [key, value] of Object.entries(config)) {
      vars[`--color-${key}`] = value.color
    }
    return vars
  }, [config])

  return (
    <div
      className={cn("aspect-[4/3] w-full overflow-hidden", className)}
      style={cssVars}
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  indicator?: "dot" | "line"
}

export function ChartTooltip({
  indicator = "line",
  children,
  className,
  ...props
}: ChartTooltipProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-2 shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  indicator?: "dot" | "line"
}

export function ChartTooltipContent({
  indicator = "line",
  children,
  className,
  ...props
}: ChartTooltipContentProps) {
  return (
    <div
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    >
      {children}
    </div>
  )
}
