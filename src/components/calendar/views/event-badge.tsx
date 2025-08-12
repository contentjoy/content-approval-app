"use client";

import { cva } from "class-variance-authority";
import { parseISO, format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IEvent } from "../interfaces";
import { EventDetailsDialog } from "../dialogs/event-details-dialog";

const eventBadgeVariants = cva(
	"flex items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer transition-colors",
	{
		variants: {
			color: {
				blue: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200",
				green: "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200",
				red: "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200",
				yellow: "bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200",
				purple: "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200",
				orange: "bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200",
			},
		},
		defaultVariants: {
			color: "blue",
		},
	},
);

interface IProps {
	event: IEvent;
	cellDate: Date;
	index: number;
}

export function EventBadge({ event, cellDate, index }: IProps) {
	const eventStart = parseISO(event.startDate);
	const eventEnd = parseISO(event.endDate);
	const isMultiDay = eventStart.toDateString() !== eventEnd.toDateString();
	
	// Format time for display
	const timeDisplay = format(eventStart, "HH:mm");
	
	// Truncate title if too long
	const displayTitle = event.title.length > 20 
		? `${event.title.substring(0, 20)}...` 
		: event.title;

	return (
		<EventDetailsDialog event={event}>
			<motion.div
				className={cn(eventBadgeVariants({ color: event.color }))}
				initial={{ opacity: 0, x: -10 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: index * 0.1, duration: 0.2 }}
				title={`${event.title} - ${timeDisplay}`}
			>
				{/* Time indicator */}
				<span className="text-xs opacity-75">{timeDisplay}</span>
				
				{/* Event title */}
				<span className="truncate">{displayTitle}</span>
				
				{/* Multi-day indicator */}
				{isMultiDay && (
					<span className="text-xs opacity-75">→</span>
				)}
			</motion.div>
		</EventDetailsDialog>
	);
}
