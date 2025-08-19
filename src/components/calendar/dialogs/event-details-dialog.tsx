"use client";

import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, Image, Video, Grid3X3, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IEvent } from "../interfaces";
import { MediaDisplay } from "@/components/posts/media-display";
import { CarouselDisplay } from "@/components/posts/carousel-display";
import type { SocialMediaPost } from "@/types";
import { supabase } from "@/lib/supabase";

interface IProps {
	event: IEvent;
	children: ReactNode;
}

// Helper function to convert IEvent to SocialMediaPost for MediaDisplay
function convertEventToPost(event: IEvent): SocialMediaPost {
	return {
		id: event.id,
		gym_id: "", // We'll need to get this from context
		"Asset URL": event.assetUrl || "",
		"Post Caption": event.description,
		"Approval Status": "Approved", // Assuming scheduled posts are approved
		"Carousel Group": event.carouselGroup || null,
		"Carousel Order": event.carouselOrder || null,
		"Asset Type": event.assetType || "photo",
		"Content Type": event.contentType || "post",
		"Gym Name": event.gymName || "",
		created_at: event.startDate,
		updated_at: event.endDate,
	};
}

export function EventDetailsDialog({ event, children }: IProps) {
	const startDate = parseISO(event.startDate);
	const endDate = parseISO(event.endDate);
	const isMultiDay = startDate.toDateString() !== endDate.toDateString();
	
	// Convert event to post for media display
	const post = convertEventToPost(event);

	// Load carousel posts if this event is part of a carousel
	const [carouselPosts, setCarouselPosts] = useState<SocialMediaPost[] | null>(null)
	useEffect(() => {
	  let active = true
	  async function load() {
	    if (!event.carouselGroup) { setCarouselPosts(null); return }
	    try {
	      const { data, error } = await supabase
	        .from('social_media_posts')
	        .select('*')
	        .eq('Carousel Group', event.carouselGroup)
	        .eq('"Approval Status"', 'Approved')
	        .eq('"Gym Name"', (typeof window !== 'undefined' ? window.location.pathname.split('/')[1].replace(/-/g, ' ').toLowerCase() : (event.gymName || '').toLowerCase()))
	        .order('Carousel Order', { ascending: true })
	      if (error) throw error
	      if (!active) return
	      const slides = (data as any[] || []) as SocialMediaPost[]
	      setCarouselPosts(slides.length ? slides : [post])
	    } catch {
	      if (!active) return
	      setCarouselPosts([post])
	    }
	  }
	  load()
	  return () => { active = false }
	}, [event.carouselGroup])

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle className="text-xl font-semibold">{event.title}</DialogTitle>
				</DialogHeader>

				<ScrollArea className="max-h-[70vh]">
					<div className="space-y-6 p-4">
						{/* Media Display */}
						{event.assetUrl && (
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
									{event.carouselGroup ? (
										<>
											<Grid3X3 className="w-4 h-4" />
											Carousel Post
										</>
									) : event.assetType === 'video' ? (
										<>
											<Video className="w-4 h-4" />
											Video
										</>
									) : (
										<>
											<Image className="w-4 h-4" />
											Image
										</>
									)}
								</div>
								
								<div className="relative w-full max-w-sm mx-auto">
									{event.carouselGroup ? (
										<CarouselDisplay
											post={(carouselPosts && carouselPosts[0]) || post}
											carouselPosts={carouselPosts || [post]}
											className="rounded-lg overflow-hidden"
										/>
									) : (
										<MediaDisplay 
											post={post}
											className="rounded-lg overflow-hidden"
										/>
									)}
								</div>
							</div>
						)}

						{/* Date and Time Information */}
						<div className="space-y-3">
							<div className="flex items-start gap-2">
								<Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Scheduled Date</p>
									<p className="text-sm text-muted-foreground">
										{format(startDate, "EEEE, MMMM d, yyyy")}
									</p>
								</div>
							</div>

							<div className="flex items-start gap-2">
								<Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Time</p>
									<p className="text-sm text-muted-foreground">
										{format(startDate, "h:mm a")}
										{isMultiDay && (
											<span> - {format(endDate, "h:mm a")}</span>
										)}
									</p>
								</div>
							</div>

							{/* Multi-day indicator */}
							{isMultiDay && (
								<div className="flex items-start gap-2">
									<Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Duration</p>
										<p className="text-sm text-muted-foreground">
											{format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Post Caption */}
						{event.description && (
							<div className="flex items-start gap-2">
								<Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Post Caption</p>
									<p className="text-sm text-muted-foreground whitespace-pre-wrap">
										{event.description}
									</p>
								</div>
							</div>
						)}

						{/* Asset URL */}
						{event.assetUrl && (
							<div className="flex items-start gap-2">
								<ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Asset URL</p>
									<a 
										href={event.assetUrl} 
										target="_blank" 
										rel="noopener noreferrer"
										className="text-sm text-blue-600 hover:text-blue-800 break-all"
									>
										{event.assetUrl}
									</a>
								</div>
							</div>
						)}

						{/* Carousel Information */}
						{event.carouselGroup && (
							<div className="flex items-start gap-2">
								<Grid3X3 className="mt-1 size-4 shrink-0 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">Carousel Group</p>
									<p className="text-sm text-muted-foreground">
										{event.carouselGroup}
										{event.carouselOrder && ` - Post ${event.carouselOrder}`}
									</p>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>

				<div className="flex justify-end gap-2 pt-4 border-t">
					<DialogClose asChild>
						<Button variant="outline">Close</Button>
					</DialogClose>
					{/* TODO: Add edit functionality */}
					<Button variant="outline" disabled>
						Edit Schedule
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
