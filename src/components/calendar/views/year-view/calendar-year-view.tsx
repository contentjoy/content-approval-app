"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO, isSameMonth } from "date-fns";
import { useCalendar } from "../../calendar-context";
import type { IEvent } from "../../interfaces";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

export function CalendarYearView({ singleDayEvents, multiDayEvents }: IProps) {
	const { selectedDate, setSelectedDate } = useCalendar();

	// Get all months for the selected year
	const yearMonths = useMemo(() => {
		const year = selectedDate.getFullYear();
		const start = new Date(year, 0, 1); // January 1st
		const end = new Date(year, 11, 31); // December 31st
		return eachMonthOfInterval({ start, end });
	}, [selectedDate]);

	// Get events for the year
	const yearEvents = useMemo(() => {
		const allEvents = [...singleDayEvents, ...multiDayEvents];
		const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
		const yearEnd = new Date(selectedDate.getFullYear(), 11, 31);
		
		return allEvents.filter(event => {
			const eventStart = parseISO(event.startDate);
			return eventStart >= yearStart && eventStart <= yearEnd;
		});
	}, [singleDayEvents, multiDayEvents, selectedDate]);

	// Group events by month
	const eventsByMonth = useMemo(() => {
		const grouped: Record<number, IEvent[]> = {};
		
		yearMonths.forEach((month, index) => {
			grouped[index] = [];
		});
		
		yearEvents.forEach(event => {
			const eventStart = parseISO(event.startDate);
			const monthIndex = eventStart.getMonth();
			if (!grouped[monthIndex]) {
				grouped[monthIndex] = [];
			}
			grouped[monthIndex].push(event);
		});
		
		return grouped;
	}, [yearEvents, yearMonths]);

	const handleMonthClick = (month: Date) => {
		setSelectedDate(month);
	};

	return (
		<motion.div 
			initial={{ opacity: 0 }} 
			animate={{ opacity: 1 }} 
			transition={{ duration: 0.3 }}
			className="w-full p-4"
		>
			{/* Year header */}
			<div className="text-center mb-6">
				<div className="text-2xl font-bold">
					{selectedDate.getFullYear()}
				</div>
				<div className="text-sm text-muted-foreground">
					{yearEvents.length} scheduled posts this year
				</div>
			</div>

			{/* Months grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{yearMonths.map((month, index) => {
					const monthEvents = eventsByMonth[index] || [];
					const isCurrentMonth = isSameMonth(month, new Date());
					const isSelectedMonth = isSameMonth(month, selectedDate);
					
					return (
						<motion.div
							key={month.toISOString()}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1, duration: 0.3 }}
							className={`
								border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md
								${isCurrentMonth ? 'border-accent bg-accent/5' : 'border-border'}
								${isSelectedMonth ? 'ring-2 ring-accent' : ''}
							`}
							onClick={() => handleMonthClick(month)}
						>
							{/* Month header */}
							<div className="text-center mb-2">
								<div className="font-semibold text-sm">
									{format(month, 'MMMM')}
								</div>
								<div className="text-xs text-muted-foreground">
									{monthEvents.length} post{monthEvents.length !== 1 ? 's' : ''}
								</div>
							</div>

							{/* Mini calendar grid */}
							<div className="grid grid-cols-7 gap-1 text-xs">
								{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
									<div key={day} className="text-center text-muted-foreground">
										{day}
									</div>
								))}
								
								{/* Calendar days */}
								{Array.from({ length: 35 }, (_, i) => {
									const dayDate = new Date(month);
									dayDate.setDate(i - new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 1);
									const isCurrentMonthDay = dayDate.getMonth() === month.getMonth();
									const hasEvents = monthEvents.some(event => {
										const eventDate = parseISO(event.startDate);
										return eventDate.getDate() === dayDate.getDate() && 
											   eventDate.getMonth() === dayDate.getMonth();
									});
									
									return (
										<div
											key={i}
											className={`
												text-center p-1 rounded text-xs
												${!isCurrentMonthDay ? 'text-muted-foreground/30' : ''}
												${hasEvents ? 'bg-accent text-accent-foreground font-medium' : ''}
												${dayDate.getDate() === 1 ? 'font-semibold' : ''}
											`}
										>
											{dayDate.getDate()}
										</div>
									);
								})}
							</div>

							{/* Event preview */}
							{monthEvents.length > 0 && (
								<div className="mt-2 space-y-1">
									{monthEvents.slice(0, 2).map((event) => (
										<div
											key={event.id}
											className="text-xs p-1 rounded bg-muted truncate"
											title={event.title}
										>
											{event.title}
										</div>
									))}
									{monthEvents.length > 2 && (
										<div className="text-xs text-muted-foreground text-center">
											+{monthEvents.length - 2} more
										</div>
									)}
								</div>
							)}
						</motion.div>
					);
				})}
			</div>
		</motion.div>
	);
}
