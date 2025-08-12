"use client";

import { isToday, startOfDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ICalendarCell, IEvent } from "../interfaces";
import { EventBadge } from "./event-badge";

interface IProps {
	cell: ICalendarCell;
	events: IEvent[];
}

const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, events }: IProps) {
	const { day, currentMonth, date } = cell;

	// Get events for this specific day
	const cellEvents = useMemo(() => {
		return events.filter((event) => {
			const eventStart = parseISO(event.startDate);
			const eventEnd = parseISO(event.endDate);
			const cellDate = startOfDay(date);
			
			// Check if event overlaps with this day
			return eventStart <= cellDate && eventEnd >= cellDate;
		});
	}, [date, events]);

	const showMoreCount = cellEvents.length - MAX_VISIBLE_EVENTS;
	const showMore = currentMonth && showMoreCount > 0;

	return (
		<motion.div
			className={cn(
				"min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border-r border-b border-border relative",
				!currentMonth && "bg-muted/30",
				isToday(date) && "bg-accent/10"
			)}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.2 }}
		>
			{/* Day number */}
			<div className={cn(
				"text-xs sm:text-sm font-medium mb-1",
				!currentMonth && "text-muted-foreground",
				isToday(date) && "text-accent-foreground font-bold"
			)}>
				{day}
			</div>

			{/* Events */}
			<div className="space-y-0.5 sm:space-y-1">
				{cellEvents.slice(0, MAX_VISIBLE_EVENTS).map((event, index) => (
					<EventBadge
						key={`${event.id}-${index}`}
						event={event}
						cellDate={date}
						index={index}
					/>
				))}
				
				{/* Show more indicator */}
				{showMore && (
					<div className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
						+{showMoreCount} more
					</div>
				)}
			</div>
		</motion.div>
	);
}
