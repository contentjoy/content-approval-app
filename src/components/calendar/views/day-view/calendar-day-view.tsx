"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useCalendar } from "../../calendar-context";
import type { IEvent } from "../../interfaces";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

// Theme-based color mapping for events
const getEventColorClasses = (color: string) => {
	const colorMap: Record<string, string> = {
		teal: "bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-200 dark:bg-teal-700 dark:text-white dark:border-teal-600 dark:hover:bg-teal-600",
		blue: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 dark:bg-blue-700 dark:text-white dark:border-blue-600 dark:hover:bg-blue-600",
		green: "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 dark:bg-green-700 dark:text-white dark:border-green-600 dark:hover:bg-green-600",
		amber: "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 dark:bg-amber-700 dark:text-white dark:border-amber-600 dark:hover:bg-amber-600",
		red: "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 dark:bg-red-700 dark:text-white dark:border-red-600 dark:hover:bg-red-600",
		purple: "bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 dark:bg-purple-700 dark:text-white dark:border-purple-600 dark:hover:bg-purple-600",
	};
	return colorMap[color] || colorMap.blue;
};

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
	const { selectedDate } = useCalendar();

	// Get events for the selected day
	const dayEvents = useMemo(() => {
		const allEvents = [...singleDayEvents, ...multiDayEvents];
		const dayStart = startOfDay(selectedDate);
		const dayEnd = endOfDay(selectedDate);
		
		return allEvents.filter(event => {
			const eventStart = parseISO(event.startDate);
			const eventEnd = parseISO(event.endDate);
			return eventStart <= dayEnd && eventEnd >= dayStart;
		}).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
	}, [singleDayEvents, multiDayEvents, selectedDate]);

	// Group events by hour
	const eventsByHour = useMemo(() => {
		const grouped: Record<number, IEvent[]> = {};
		
		TIME_SLOTS.forEach(hour => {
			grouped[hour] = [];
		});
		
		dayEvents.forEach(event => {
			const eventStart = parseISO(event.startDate);
			const hour = eventStart.getHours();
			if (!grouped[hour]) {
				grouped[hour] = [];
			}
			grouped[hour].push(event);
		});
		
		return grouped;
	}, [dayEvents]);

	return (
		<motion.div 
			initial={{ opacity: 0 }} 
			animate={{ opacity: 1 }} 
			transition={{ duration: 0.3 }}
			className="w-full"
		>
			{/* Day header */}
			<div className="p-4 border-b bg-muted/30">
				<div className="text-lg font-semibold">
					{format(selectedDate, 'EEEE, MMMM d, yyyy')}
				</div>
				<div className="text-sm text-muted-foreground">
					{dayEvents.length} scheduled post{dayEvents.length !== 1 ? 's' : ''}
				</div>
			</div>

			{/* Time slots */}
			<div className="grid grid-cols-1">
				{TIME_SLOTS.map((hour) => {
					const events = eventsByHour[hour] || [];
					const isCurrentHour = new Date().getHours() === hour;
					
					return (
						<div 
							key={hour} 
							className={`
								flex border-b min-h-[80px] relative
								${isCurrentHour ? 'bg-accent/10' : ''}
							`}
						>
							{/* Time label */}
							<div className="w-20 p-2 text-sm text-muted-foreground border-r bg-muted/20 flex-shrink-0">
								{format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
							</div>
							
							{/* Events for this hour */}
							<div className="flex-1 p-2">
								{events.length === 0 ? (
									<div className="text-xs text-muted-foreground/50 italic">
										No posts scheduled
									</div>
								) : (
									<div className="space-y-2">
										{events.map((event) => (
											<div
												key={event.id}
												className={`p-2 rounded border cursor-pointer transition-colors ${getEventColorClasses(event.color)}`}
											>
												<div className="flex items-center justify-between">
													<div className="font-medium text-sm">
														{event.title}
													</div>
													<div className="text-xs text-muted-foreground">
														{format(parseISO(event.startDate), 'h:mm a')}
													</div>
												</div>
												{event.description && (
													<div className="text-xs text-muted-foreground mt-1 line-clamp-2">
														{event.description}
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</motion.div>
	);
}
