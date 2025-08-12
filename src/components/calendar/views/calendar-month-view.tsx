import { motion } from "framer-motion";
import { useMemo } from "react";
import { useCalendar } from "../calendar-context";
import type { IEvent } from "../interfaces";
import { DayCell } from "./day-cell";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ singleDayEvents, multiDayEvents }: IProps) {
	const { selectedDate } = useCalendar();

	const allEvents = [...multiDayEvents, ...singleDayEvents];

	const cells = useMemo(() => {
		const year = selectedDate.getFullYear();
		const month = selectedDate.getMonth();
		
		// Get first day of month
		const firstDay = new Date(year, month, 1);
		// Get last day of month
		const lastDay = new Date(year, month + 1, 0);
		
		// Get first day to display (previous month's days to fill first week)
		const firstDisplayDay = new Date(firstDay);
		firstDisplayDay.setDate(firstDay.getDate() - firstDay.getDay());
		
		const cells = [];
		const currentDate = new Date(firstDisplayDay);
		
		// Generate 42 cells (6 weeks * 7 days)
		for (let i = 0; i < 42; i++) {
			const isCurrentMonth = currentDate.getMonth() === month;
			cells.push({
				day: currentDate.getDate(),
				currentMonth: isCurrentMonth,
				date: new Date(currentDate),
			});
			currentDate.setDate(currentDate.getDate() + 1);
		}
		
		return cells;
	}, [selectedDate]);

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
			<div className="grid grid-cols-7">
				{WEEK_DAYS.map((day, index) => (
					<motion.div
						key={day}
						className="flex items-center justify-center py-2 font-medium text-sm text-muted-foreground"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05, duration: 0.3 }}
					>
						{day}
					</motion.div>
				))}
			</div>

			<div className="grid grid-cols-7">
				{cells.map((cell, index) => (
					<DayCell
						key={index}
						cell={cell}
						events={allEvents}
					/>
				))}
			</div>
		</motion.div>
	);
}
