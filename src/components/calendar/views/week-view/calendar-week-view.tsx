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
				const eventEnd = parseISO(event.endDate);
				
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
							{format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
						</div>
						
						{/* Day columns */}
						{weekDays.map((day) => {
							const dayKey = format(day, 'yyyy-MM-dd');
							const events = eventsByDayAndTime[dayKey]?.[hour] || [];
							
							return (
								<div key={day.toISOString()} className="p-1 border-r border-b min-h-[60px] relative">
									{events.map((event, index) => (
										<div
											key={event.id}
											className="text-xs p-1 mb-1 rounded bg-blue-100 text-blue-800 border border-blue-200 truncate cursor-pointer hover:bg-blue-200"
											title={`${event.title} - ${format(parseISO(event.startDate), 'HH:mm')}`}
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
