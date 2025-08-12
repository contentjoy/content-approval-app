import type { TEventColor } from "./types";

export interface IUser {
	id: string;
	name: string;
	picturePath: string | null;
}

export interface IEvent {
	id: string;
	startDate: string;
	endDate: string;
	title: string;
	color: TEventColor;
	description: string;
	user: IUser;
	// Additional fields for our posts
	assetUrl?: string;
	assetType?: string;
	carouselGroup?: string;
	carouselOrder?: number;
	contentType?: string;
	gymName?: string;
}

export interface ICalendarCell {
	day: number;
	currentMonth: boolean;
	date: Date;
}
