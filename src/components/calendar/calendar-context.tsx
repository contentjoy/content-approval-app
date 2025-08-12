"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import type { IEvent, IUser } from "./interfaces";
import type { TCalendarView, TEventColor } from "./types";

interface ICalendarContext {
	selectedDate: Date;
	view: TCalendarView;
	setView: (view: TCalendarView) => void;
	agendaModeGroupBy: "date" | "color";
	setAgendaModeGroupBy: (groupBy: "date" | "color") => void;
	use24HourFormat: boolean;
	toggleTimeFormat: () => void;
	setSelectedDate: (date: Date) => void;
	selectedUserId: IUser["id"] | "all";
	setSelectedUserId: (userId: IUser["id"] | "all") => void;
	badgeVariant: "dot" | "colored";
	setBadgeVariant: (variant: "dot" | "colored") => void;
	selectedColors: TEventColor[];
	filterEventsBySelectedColors: (colors: TEventColor) => void;
	filterEventsBySelectedUser: (userId: IUser["id"] | "all") => void;
	users: IUser[];
	events: IEvent[];
	addEvent: (event: IEvent) => void;
	updateEvent: (event: IEvent) => void;
	removeEvent: (eventId: string) => void;
	clearFilter: () => void;
}

interface CalendarSettings {
	badgeVariant: "dot" | "colored";
	view: TCalendarView;
	use24HourFormat: boolean;
	agendaModeGroupBy: "date" | "color";
}

const DEFAULT_SETTINGS: CalendarSettings = {
	badgeVariant: "colored" as const,
	view: "month" as TCalendarView,
	use24HourFormat: true,
	agendaModeGroupBy: "date" as const,
};

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({
	children,
	users,
	events,
	badge = "colored",
	view = "month",
}: {
	children: React.ReactNode;
	users: IUser[];
	events: IEvent[];
	view?: TCalendarView;
	badge?: "dot" | "colored";
}) {
	const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
		badge,
	);
	const [currentView, setCurrentViewState] = useState<TCalendarView>(view);
	const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
		DEFAULT_SETTINGS.use24HourFormat,
	);
	const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
		"date" | "color"
	>(DEFAULT_SETTINGS.agendaModeGroupBy);

	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">("all");
	const [selectedColors, setSelectedColors] = useState<TEventColor[]>([]);

	const [allEvents, setAllEvents] = useState<IEvent[]>(events || []);
	const [filteredEvents, setFilteredEvents] = useState<IEvent[]>(events || []);

	// Update events when they change
	useEffect(() => {
		setAllEvents(events || []);
		setFilteredEvents(events || []);
	}, [events]);

	const updateSettings = (newPartialSettings: Partial<typeof DEFAULT_SETTINGS>) => {
		// Update state based on new settings
		if (newPartialSettings.badgeVariant !== undefined) {
			setBadgeVariantState(newPartialSettings.badgeVariant);
		}
		if (newPartialSettings.view !== undefined) {
			setCurrentViewState(newPartialSettings.view);
		}
		if (newPartialSettings.use24HourFormat !== undefined) {
			setUse24HourFormatState(newPartialSettings.use24HourFormat);
		}
		if (newPartialSettings.agendaModeGroupBy !== undefined) {
			setAgendaModeGroupByState(newPartialSettings.agendaModeGroupBy);
		}
	};

	const setView = (view: TCalendarView) => {
		setCurrentViewState(view);
		updateSettings({ view });
	};

	const setBadgeVariant = (variant: "dot" | "colored") => {
		setBadgeVariantState(variant);
		updateSettings({ badgeVariant: variant });
	};

	const toggleTimeFormat = () => {
		const newFormat = !use24HourFormat;
		setUse24HourFormatState(newFormat);
		updateSettings({ use24HourFormat: newFormat });
	};

	const setAgendaModeGroupBy = (groupBy: "date" | "color") => {
		setAgendaModeGroupByState(groupBy);
		updateSettings({ agendaModeGroupBy: groupBy });
	};

	const filterEventsBySelectedColors = (color: TEventColor) => {
		setSelectedColors((prev) => {
			const newColors = prev.includes(color)
				? prev.filter((c) => c !== color)
				: [...prev, color];
			
			// Filter events based on selected colors
			const filtered = allEvents.filter((event) => 
				newColors.length === 0 || newColors.includes(event.color)
			);
			setFilteredEvents(filtered);
			
			return newColors;
		});
	};

	const filterEventsBySelectedUser = (userId: IUser["id"] | "all") => {
		setSelectedUserId(userId);
		const filtered = allEvents.filter((event) => 
			userId === "all" || event.user.id === userId
		);
		setFilteredEvents(filtered);
	};

	const addEvent = (event: IEvent) => {
		const newEvents = [...allEvents, event];
		setAllEvents(newEvents);
		setFilteredEvents(newEvents);
	};

	const updateEvent = (event: IEvent) => {
		const newEvents = allEvents.map((e) => (e.id === event.id ? event : e));
		setAllEvents(newEvents);
		setFilteredEvents(newEvents);
	};

	const removeEvent = (eventId: string) => {
		const newEvents = allEvents.filter((e) => e.id !== eventId);
		setAllEvents(newEvents);
		setFilteredEvents(newEvents);
	};

	const clearFilter = () => {
		setSelectedColors([]);
		setSelectedUserId("all");
		setFilteredEvents(allEvents);
	};

	const value: ICalendarContext = {
		selectedDate,
		view: currentView,
		setView,
		agendaModeGroupBy,
		setAgendaModeGroupBy,
		use24HourFormat,
		toggleTimeFormat,
		setSelectedDate,
		selectedUserId,
		setSelectedUserId,
		badgeVariant,
		setBadgeVariant,
		selectedColors,
		filterEventsBySelectedColors,
		filterEventsBySelectedUser,
		users,
		events: filteredEvents,
		addEvent,
		updateEvent,
		removeEvent,
		clearFilter,
	};

	return (
		<CalendarContext.Provider value={value}>
			{children}
		</CalendarContext.Provider>
	);
}

export const useCalendar = () => {
	const context = useContext(CalendarContext);
	if (!context) {
		throw new Error("useCalendar must be used within a CalendarProvider");
	}
	return context;
};
