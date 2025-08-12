import type { ScheduledPostSummary } from "@/lib/database";
import type { IEvent, IUser } from "./interfaces";
import type { TEventColor } from "./types";

// Map content types to colors
const contentTypeToColor: Record<string, TEventColor> = {
	"instagram": "blue",
	"facebook": "purple",
	"tiktok": "red",
	"twitter": "blue",
	"linkedin": "blue",
	"youtube": "red",
	"post": "green",
	"story": "purple",
	"reel": "orange",
	"default": "blue",
};

// Map asset types to colors
const assetTypeToColor: Record<string, TEventColor> = {
	"video": "red",
	"photo": "blue",
	"carousel": "purple",
	"default": "blue",
};

export function convertPostToEvent(post: ScheduledPostSummary, gymName: string): IEvent {
	// Determine color based on content type or asset type
	let color: TEventColor = "blue";
	
	if (post["Content Type"]) {
		color = contentTypeToColor[post["Content Type"].toLowerCase()] || contentTypeToColor.default;
	} else if (post["Asset Type"]) {
		color = assetTypeToColor[post["Asset Type"].toLowerCase()] || assetTypeToColor.default;
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

	// Create start and end dates
	const scheduledDate = post.Scheduled ? new Date(post.Scheduled) : new Date();
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
	return posts
		.filter(post => post.Scheduled) // Only include scheduled posts
		.map(post => convertPostToEvent(post, gymName))
		.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}
