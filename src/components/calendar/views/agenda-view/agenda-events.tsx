"use client";

import React from "react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { format, parseISO, isToday, isTomorrow, isYesterday } from "date-fns";
import { useCalendar } from "../../calendar-context";
import type { IEvent } from "../../interfaces";
import { EventDetailsDialog } from "../../dialogs/event-details-dialog";

interface IProps {
	singleDayEvents: IEvent[];
	multiDayEvents: IEvent[];
}

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

// Color indicator mapping
const getColorIndicatorClasses = (color: string) => {
	const colorMap: Record<string, string> = {
		teal: "bg-teal-500 border-teal-600",
		blue: "bg-blue-500 border-blue-600",
		green: "bg-green-500 border-green-600",
		amber: "bg-amber-500 border-amber-600",
		red: "bg-red-500 border-red-600",
		purple: "bg-purple-500 border-purple-600",
	};
	return colorMap[color] || colorMap.blue;
};

export function AgendaEvents({ singleDayEvents, multiDayEvents }: IProps) {
	const { agendaModeGroupBy } = useCalendar();

	// Get all events and sort by date
	const allEvents = useMemo(() => {
		const events = [...singleDayEvents, ...multiDayEvents];
		return events.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
	}, [singleDayEvents, multiDayEvents]);

	// Group events by date or color
	const groupedEvents = useMemo(() => {
		if (agendaModeGroupBy === "date") {
			const grouped: Record<string, IEvent[]> = {};
			
			allEvents.forEach(event => {
				const eventDate = parseISO(event.startDate);
				const dateKey = format(eventDate, 'yyyy-MM-dd');
				
				if (!grouped[dateKey]) {
					grouped[dateKey] = [];
				}
				grouped[dateKey].push(event);
			});
			
			return grouped;
		} else {
			// Group by color
			const grouped: Record<string, IEvent[]> = {};
			
			allEvents.forEach(event => {
				const color = event.color;
				if (!grouped[color]) {
					grouped[color] = [];
				}
				grouped[color].push(event);
			});
			
			return grouped;
		}
	}, [allEvents, agendaModeGroupBy]);

	const getRelativeDate = (date: Date) => {
		if (isToday(date)) return "Today";
		if (isTomorrow(date)) return "Tomorrow";
		if (isYesterday(date)) return "Yesterday";
		return format(date, 'EEEE, MMMM d');
	};

	const getColorLabel = (color: string) => {
		const colorLabels: Record<string, string> = {
			teal: "Story Posts",
			blue: "Photo Posts", 
			green: "General Posts",
			amber: "Reel Posts",
			red: "Video Posts",
			purple: "Carousel Posts"
		};
		return colorLabels[color] || `${color.charAt(0).toUpperCase() + color.slice(1)} Posts`;
	};

	return (
		<motion.div 
			initial={{ opacity: 0 }} 
			animate={{ opacity: 1 }} 
			transition={{ duration: 0.3 }}
			className="w-full p-4"
		>
			{/* Agenda header */}
			<div className="mb-6">
				<div className="text-xl font-semibold mb-2">Agenda</div>
				<div className="text-sm text-muted-foreground">
					{allEvents.length} scheduled posts
				</div>
			</div>

			{/* Events list */}
			<div className="space-y-6">
				{Object.entries(groupedEvents).map(([key, events]) => {
					const sortedEvents = events.sort((a, b) => 
						parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
					);
					
					return (
						<motion.div
							key={key}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
						>
							{/* Group header */}
							<div className="mb-3 pb-2 border-b">
								<div className="font-semibold text-lg">
									{agendaModeGroupBy === "date" 
										? getRelativeDate(parseISO(key + "T00:00:00"))
										: getColorLabel(key)
									}
								</div>
								<div className="text-sm text-muted-foreground">
									{events.length} post{events.length !== 1 ? 's' : ''}
								</div>
							</div>

							{/* Events in this group */}
							<div className="space-y-3">
								{sortedEvents.map((event, index) => {
									const eventDate = parseISO(event.startDate);
									const isCurrentEvent = isToday(eventDate);
									
									return (
										<EventDetailsDialog key={event.id} event={event}>
											<motion.div
												initial={{ opacity: 0, x: -20 }}
												animate={{ opacity: 1, x: 0 }}
												transition={{ delay: index * 0.1, duration: 0.2 }}
												className={`
													p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md
													${isCurrentEvent ? 'border-accent bg-accent/5' : 'border-border bg-card'}
													hover:border-accent/50 hover:bg-accent/5
												`}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-2">
															<div className="font-medium text-base">
																{event.title}
															</div>
															{event.carouselGroup && (
																<span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
																	Carousel
																</span>
															)}
														</div>
														
														{event.description && (
															<div className="text-sm text-muted-foreground mb-2 line-clamp-2">
																{event.description}
															</div>
														)}
														
														<div className="flex items-center gap-4 text-xs text-muted-foreground">
															<span>
																{format(eventDate, 'MMM d, yyyy')}
															</span>
															<span>
																{format(eventDate, 'h:mm a')}
															</span>
															{event.assetType && (
																<span className="capitalize">
																	{event.assetType}
																</span>
															)}
														</div>
													</div>
													
													{/* Color indicator */}
													<div 
														className={`w-4 h-4 rounded-full ml-3 flex-shrink-0 border ${getColorIndicatorClasses(event.color)}`}
													/>
												</div>
											</motion.div>
										</EventDetailsDialog>
									);
								})}
							</div>
						</motion.div>
					);
				})}
			</div>

			{/* Empty state */}
			{allEvents.length === 0 && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					className="text-center py-12"
				>
					<div className="text-muted-foreground mb-2">No scheduled posts found</div>
					<div className="text-sm text-muted-foreground">
						Posts will appear here once they are scheduled
					</div>
				</motion.div>
			)}
		</motion.div>
	);
}
