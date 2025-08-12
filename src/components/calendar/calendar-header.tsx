"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3, List, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useCalendar } from "./calendar-context";
import type { TCalendarView } from "./types";

const VIEW_ICONS = {
	day: CalendarIcon,
	week: CalendarDays,
	month: Grid3X3,
	year: CalendarDays,
	agenda: List,
};

export function CalendarHeader() {
	const { selectedDate, setSelectedDate, view, setView } = useCalendar();

	const goToPrevious = () => {
		const newDate = new Date(selectedDate);
		switch (view) {
			case "day":
				newDate.setDate(newDate.getDate() - 1);
				break;
			case "week":
				newDate.setDate(newDate.getDate() - 7);
				break;
			case "month":
				newDate.setMonth(newDate.getMonth() - 1);
				break;
			case "year":
				newDate.setFullYear(newDate.getFullYear() - 1);
				break;
		}
		setSelectedDate(newDate);
	};

	const goToNext = () => {
		const newDate = new Date(selectedDate);
		switch (view) {
			case "day":
				newDate.setDate(newDate.getDate() + 1);
				break;
			case "week":
				newDate.setDate(newDate.getDate() + 7);
				break;
			case "month":
				newDate.setMonth(newDate.getMonth() + 1);
				break;
			case "year":
				newDate.setFullYear(newDate.getFullYear() + 1);
				break;
		}
		setSelectedDate(newDate);
	};

	const goToToday = () => {
		setSelectedDate(new Date());
	};

	const getDateDisplay = () => {
		switch (view) {
			case "day":
				return format(selectedDate, "EEEE, MMMM d, yyyy");
			case "week":
				const weekStart = new Date(selectedDate);
				weekStart.setDate(weekStart.getDate() - weekStart.getDay());
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekEnd.getDate() + 6);
				return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
			case "month":
				return format(selectedDate, "MMMM yyyy");
			case "year":
				return format(selectedDate, "yyyy");
			case "agenda":
				return "Agenda";
			default:
				return format(selectedDate, "MMMM yyyy");
		}
	};

	return (
		<div className="flex items-center justify-between p-4 border-b">
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={goToPrevious}
					className="h-8 w-8 p-0"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={goToNext}
					className="h-8 w-8 p-0"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={goToToday}
					className="h-8 px-3"
				>
					Today
				</Button>
				<div className="ml-4 text-lg font-semibold">
					{getDateDisplay()}
				</div>
			</div>

			<div className="flex items-center gap-1">
				{(Object.keys(VIEW_ICONS) as TCalendarView[]).map((viewType) => {
					const Icon = VIEW_ICONS[viewType];
					return (
						<Button
							key={viewType}
							variant={view === viewType ? "default" : "outline"}
							size="sm"
							onClick={() => setView(viewType)}
							className="h-8 px-3 capitalize"
						>
							<Icon className="h-4 w-4 mr-1" />
							{viewType}
						</Button>
					);
				})}
			</div>
		</div>
	);
}
