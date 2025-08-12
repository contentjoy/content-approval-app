"use client";

import { isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import React from "react";
import { useCalendar } from "./calendar-context";
import { CalendarMonthView } from "./views/calendar-month-view";

export function CalendarBody() {
	const { view, events } = useCalendar();

	const singleDayEvents = events.filter((event) => {
		const startDate = parseISO(event.startDate);
		const endDate = parseISO(event.endDate);
		return isSameDay(startDate, endDate);
	});

	const multiDayEvents = events.filter((event) => {
		const startDate = parseISO(event.startDate);
		const endDate = parseISO(event.endDate);
		return !isSameDay(startDate, endDate);
	});

	return (
		<div className="w-full h-full overflow-scroll relative">
			<motion.div
				key={view}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: 0.2 }}
			>
				{view === "month" && (
					<CalendarMonthView
						singleDayEvents={singleDayEvents}
						multiDayEvents={multiDayEvents}
					/>
				)}
				{/* TODO: Add other views (week, day, year, agenda) */}
				{view !== "month" && (
					<div className="p-8 text-center text-muted-foreground">
						{view.charAt(0).toUpperCase() + view.slice(1)} view coming soon...
					</div>
				)}
			</motion.div>
		</div>
	);
}
