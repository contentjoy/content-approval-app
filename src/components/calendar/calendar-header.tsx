"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3, List, CalendarDays, Palette, Calendar as CalendarDate } from "lucide-react";
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
	const { selectedDate, setSelectedDate, view, setView, agendaModeGroupBy, setAgendaModeGroupBy } = useCalendar();

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
		<div className="border-b">
			{/* Top row: Navigation and Today button */}
			<div className="flex items-center justify-between p-3 sm:p-4">
				<div className="flex items-center gap-1 sm:gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={goToPrevious}
						className="h-8 w-8 p-0 flex-shrink-0"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={goToNext}
						className="h-8 w-8 p-0 flex-shrink-0"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={goToToday}
						className="h-8 px-2 sm:px-3 text-sm flex-shrink-0"
					>
						Today
					</Button>
				</div>

				{/* View switching buttons - compact on mobile */}
				<div className="flex items-center gap-1">
					{(Object.keys(VIEW_ICONS) as TCalendarView[]).map((viewType) => {
						const Icon = VIEW_ICONS[viewType];
						return (
							<Button
								key={viewType}
								variant={view === viewType ? "default" : "outline"}
								size="sm"
								onClick={() => setView(viewType)}
								className="h-8 px-2 sm:px-3 text-xs sm:text-sm capitalize flex-shrink-0"
							>
								<Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
								<span className="hidden sm:inline">{viewType}</span>
								<span className="sm:hidden">{viewType.charAt(0).toUpperCase()}</span>
							</Button>
						);
					})}
				</div>
			</div>

			{/* Bottom row: Date display and agenda controls */}
			<div className="flex items-center justify-between px-3 sm:px-4 pb-3 sm:pb-4">
				<div className="text-base sm:text-lg font-semibold">
					{getDateDisplay()}
				</div>

				{/* Agenda grouping controls */}
				{view === "agenda" && (
					<div className="flex items-center gap-1">
						<Button
							variant={agendaModeGroupBy === "date" ? "default" : "outline"}
							size="sm"
							onClick={() => setAgendaModeGroupBy("date")}
							className="h-7 px-2 text-xs flex items-center gap-1"
						>
							<CalendarDate className="h-3 w-3" />
							<span className="hidden sm:inline">Date</span>
						</Button>
						<Button
							variant={agendaModeGroupBy === "color" ? "default" : "outline"}
							size="sm"
							onClick={() => setAgendaModeGroupBy("color")}
							className="h-7 px-2 text-xs flex items-center gap-1"
						>
							<Palette className="h-3 w-3" />
							<span className="hidden sm:inline">Color</span>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
