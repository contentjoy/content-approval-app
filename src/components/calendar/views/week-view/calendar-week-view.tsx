"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, parseISO } from "date-fns";
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

export function CalendarWeekView({ singleDayEvents, multiDayEvents }: IProps) {
	const { selectedDate } = useCalendar();

	// Get the week range
	const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday start
	const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
	const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

	// Get events for the week
	const weekEvents = useMemo(() => {
		const allEvents = [...singleDayEvents, ...multiDayEvents];
		return allEvents.filter(event => {
			const eventStart = parseISO(event.startDate);
			const eventEnd = parseISO(event.endDate);
			return eventStart <= weekEnd && eventEnd >= weekStart;
		});
	}, [singleDayEvents, multiDayEvents, weekStart, weekEnd]);

	// Group events by day and time
	const eventsByDayAndTime = useMemo(() => {
		const grouped: Record<string, Record<number, IEvent[]>> = {};
		
		weekDays.forEach(day => {
			const dayKey = format(day, 'yyyy-MM-dd');
			grouped[dayKey] = {};
			
			// Initialize time slots
			TIME_SLOTS.forEach(hour => {
				grouped[dayKey][hour] = [];
			});
			
			// Add events to appropriate time slots
			weekEvents.forEach(event => {
				const eventStart = parseISO(event.startDate);
				
				if (isSameDay(eventStart, day)) {
					const hour = eventStart.getHours();
					if (!grouped[dayKey][hour]) {
						grouped[dayKey][hour] = [];
					}
					grouped[dayKey][hour].push(event);
				}
			});
		});
		
		return grouped;
	}, [weekDays, weekEvents]);

	return (
		<motion.div 
			initial={{ opacity: 0 }} 
			animate={{ opacity: 1 }} 
			transition={{ duration: 0.3 }}
			className="w-full overflow-auto"
		>
			{/* Week header */}
			<div className="grid grid-cols-8 border-b bg-muted/30">
				<div className="p-2 text-sm font-medium text-muted-foreground">Time</div>
				{weekDays.map((day) => (
					<div key={day.toISOString()} className="p-2 text-center border-l">
						<div className="text-sm font-medium">
							{format(day, 'EEE')}
						</div>
						<div className="text-xs text-muted-foreground">
							{format(day, 'MMM d')}
						</div>
					</div>
				))}
			</div>

			{/* Time slots */}
			<div className="grid grid-cols-8">
				{TIME_SLOTS.map((hour) => (
					<React.Fragment key={hour}>
						{/* Time label */}
						<div className="p-1 text-xs text-muted-foreground border-r border-b bg-muted/20">
							{format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
						</div>
						
						{/* Day columns */}
						{weekDays.map((day) => {
							const dayKey = format(day, 'yyyy-MM-dd');
							const events = eventsByDayAndTime[dayKey]?.[hour] || [];
							
							return (
								<div key={day.toISOString()} className="p-1 border-r border-b min-h-[60px] relative">
									{events.map((event) => (
										<div
											key={event.id}
											className={`text-xs p-1 mb-1 rounded truncate cursor-pointer transition-colors ${getEventColorClasses(event.color)}`}
											title={`${event.title} - ${format(parseISO(event.startDate), 'h:mm a')}`}
										>
											{event.title}
										</div>
									))}
								</div>
							);
						})}
					</React.Fragment>
				))}
			</div>
		</motion.div>
	);
}
