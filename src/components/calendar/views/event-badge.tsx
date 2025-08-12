"use client";

import { cva } from "class-variance-authority";
import { parseISO, format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IEvent } from "../interfaces";
import { EventDetailsDialog } from "../dialogs/event-details-dialog";

const eventBadgeVariants = cva(
	"flex items-center gap-1 truncate rounded px-1 sm:px-1.5 py-0.5 text-xs font-medium cursor-pointer transition-colors",
	{
		variants: {
			color: {
				// Light mode: Material 300, Dark mode: Material 700
				teal: "bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-200 dark:bg-teal-700 dark:text-white dark:border-teal-600 dark:hover:bg-teal-600",
				blue: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 dark:bg-blue-700 dark:text-white dark:border-blue-600 dark:hover:bg-blue-600",
				green: "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 dark:bg-green-700 dark:text-white dark:border-green-600 dark:hover:bg-green-600",
				amber: "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 dark:bg-amber-700 dark:text-white dark:border-amber-600 dark:hover:bg-amber-600",
				red: "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 dark:bg-red-700 dark:text-white dark:border-red-600 dark:hover:bg-red-600",
				purple: "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 dark:bg-purple-700 dark:text-white dark:border-purple-600 dark:hover:bg-purple-600",
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

// Safe text truncation that preserves emojis
function safeTruncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	
	// Try to find a good breaking point (space, punctuation, or emoji boundary)
	let breakPoint = maxLength;
	
	// Look for a space to break at
	for (let i = maxLength; i > 0; i--) {
		if (text[i] === ' ' || text[i] === '\n' || text[i] === '\t') {
			breakPoint = i;
			break;
		}
	}
	
	// If no good break point found, just truncate at maxLength
	if (breakPoint === maxLength) {
		breakPoint = maxLength;
	}
	
	return text.substring(0, breakPoint) + '...';
}

export function EventBadge({ event, cellDate, index }: IProps) {
	const eventStart = parseISO(event.startDate);
	const eventEnd = parseISO(event.endDate);
	const isMultiDay = eventStart.toDateString() !== eventEnd.toDateString();
	
	// Format time for display - use 12-hour format for better readability
	const timeDisplay = format(eventStart, "h:mm a");
	
	// Safe truncate title that preserves emojis
	const maxLength = window.innerWidth < 640 ? 15 : 20;
	const displayTitle = safeTruncate(event.title, maxLength);

	return (
		<EventDetailsDialog event={event}>
			<motion.div
				className={cn(eventBadgeVariants({ color: event.color }))}
				initial={{ opacity: 0, x: -10 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: index * 0.1, duration: 0.2 }}
				title={`${event.title} - ${timeDisplay}`}
			>
				{/* Time indicator - hidden on very small screens */}
				<span className="text-xs opacity-75 hidden sm:inline">{timeDisplay}</span>
				
				{/* Event title */}
				<span className="truncate text-xs">{displayTitle}</span>
				
				{/* Multi-day indicator */}
				{isMultiDay && (
					<span className="text-xs opacity-75 hidden sm:inline">→</span>
				)}
			</motion.div>
		</EventDetailsDialog>
	);
}
