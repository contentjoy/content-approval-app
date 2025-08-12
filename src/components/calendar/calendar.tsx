import React from "react";
import { CalendarBody } from "./calendar-body";
import { CalendarProvider } from "./calendar-context";
import { CalendarHeader } from "./calendar-header";
import type { IEvent, IUser } from "./interfaces";

interface CalendarProps {
	events: IEvent[];
	users?: IUser[];
	view?: "day" | "week" | "month" | "year" | "agenda";
	badge?: "dot" | "colored";
}

export function Calendar({ 
	events, 
	users = [], 
	view = "month",
	badge = "colored" 
}: CalendarProps) {
	return (
		<CalendarProvider events={events} users={users} view={view} badge={badge}>
			<div className="w-full border rounded-xl bg-background">
				<CalendarHeader />
				<CalendarBody />
			</div>
		</CalendarProvider>
	);
}
