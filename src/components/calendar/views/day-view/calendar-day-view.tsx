"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { useCalendar } from "../../calendar-context";
import type { IEvent } from "../../interfaces";
import { EventBadge } from "../event-badge";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

export function CalendarDayView({ singleDayEvents, multiDayEvents }: IProps) {
	const { selectedDate } = useCalendar();

	// Get events for the selected day
	const dayEvents = useMemo(() => {
		const allEvents = [...singleDayEvents, ...multiDayEvents];
		const dayStart = startOfDay(selectedDate);
		const dayEnd = endOfDay(selectedDate);
		
		return allEvents.filter(event => {
			const eventStart = parseISO(event.startDate);
			return eventStart >= dayStart && eventStart <= dayEnd;
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
										{events.map((event, index) => (
											<EventBadge
												key={event.id}
												event={event}
												cellDate={selectedDate}
												index={index}
											/>
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
