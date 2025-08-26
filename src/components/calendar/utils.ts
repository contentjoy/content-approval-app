import type { ScheduledPostSummary } from "@/lib/database";
import type { IEvent, IUser } from "./interfaces";
import type { TEventColor } from "./types";
import { formatInTimeZone } from 'date-fns-tz';

// Map asset types to colors - prioritize asset type over content type
const assetTypeToColor: Record<string, TEventColor> = {
	"carousel": "purple",
	"video": "red",
	"photo": "blue",
	"story": "teal",
	"reel": "amber",
	"default": "blue",
};

// Fallback content type colors (only used if asset type not found)
const contentTypeToColor: Record<string, TEventColor> = {
	"instagram": "blue",
	"facebook": "purple",
	"tiktok": "red",
	"twitter": "blue",
	"linkedin": "blue",
	"youtube": "red",
	"post": "green",
	"story": "teal",
	"reel": "amber",
	"default": "blue",
};

export function convertPostToEvent(post: ScheduledPostSummary, gymName: string): IEvent {
	// Determine color based on asset type first, then content type as fallback
	let color: TEventColor = "blue";
	
	if (post["Asset Type"]) {
		color = assetTypeToColor[post["Asset Type"].toLowerCase()] || assetTypeToColor.default;
	} else if (post["Content Type"]) {
		color = contentTypeToColor[post["Content Type"].toLowerCase()] || contentTypeToColor.default;
	}

	// Create event title
	let title = post["Post Caption"] || "Scheduled Post";
	if (title.length > 50) {
		title = title.substring(0, 50) + "...";
	}

	// Handle carousel posts
	const carouselGroup = post["Carousel Group"];
	const carouselOrder = post["Carousel Order"];
	
	if (carouselGroup && carouselOrder) {
		title = `${title} #${carouselOrder}`;
	}

	// Get user's timezone
	const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

	// Create start and end dates - handle UTC to local conversion
	let scheduledDate: Date;
	if (post.Scheduled) {
		try {
			// Treat the timestamp as UTC by appending 'Z'
			const utcTimestamp = post.Scheduled.endsWith('Z') ? post.Scheduled : `${post.Scheduled}Z`;
			// Parse as UTC and let the browser handle timezone conversion
			scheduledDate = new Date(utcTimestamp);
		} catch (error) {
			console.error('Invalid timestamp:', post.Scheduled, error);
			scheduledDate = new Date(); // Fallback to current time
		}
	} else {
		scheduledDate = new Date();
	}
	
	const endDate = new Date(scheduledDate.getTime() + 30 * 60 * 1000); // 30 minutes duration

	// Create user object (placeholder for now)
	const user: IUser = {
		id: "system",
		name: gymName,
		picturePath: null,
	};

	return {
		id: post.id,
		startDate: scheduledDate.toISOString(),
		endDate: endDate.toISOString(),
		title,
		color,
		description: post["Post Caption"] || "",
		user,
		assetUrl: post["Asset URL"],
		assetType: post["Asset Type"],
		carouselGroup: post["Carousel Group"] || undefined,
		carouselOrder: post["Carousel Order"] || undefined,
		contentType: post["Content Type"] || undefined,
		gymName: post["Gym Name"] || undefined,
	};
}

export function convertPostsToEvents(posts: ScheduledPostSummary[], gymName: string): IEvent[] {
	// Build single events and group carousels so one event represents the whole set
	const singles: ScheduledPostSummary[] = []
	const groups: Record<string, ScheduledPostSummary[]> = {}

	posts.forEach(p => {
		if (!p.Scheduled) return
		const group = p["Carousel Group"]
		if (group) {
			const key = String(group)
			if (!groups[key]) groups[key] = []
			groups[key].push(p)
		} else {
			singles.push(p)
		}
	})

	const carouselEvents: IEvent[] = []
	for (const arr of (Object.values(groups) as ScheduledPostSummary[][])) {
		const sorted: ScheduledPostSummary[] = arr.slice().sort((a, b) => new Date(a.Scheduled || '').getTime() - new Date(b.Scheduled || '').getTime())
		const anchor: ScheduledPostSummary = sorted[0]
		const ev: IEvent = convertPostToEvent(anchor, gymName)
		;(ev as any).assetType = 'carousel'
		carouselEvents.push(ev)
	}

	const singleEvents = singles.map(p => convertPostToEvent(p, gymName))

	return [...singleEvents, ...carouselEvents]
		.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
}
