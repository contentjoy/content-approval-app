import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
	return (
		<div className="w-full border rounded-xl bg-background">
			{/* Header skeleton */}
			<div className="p-4 border-b">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Skeleton className="h-8 w-8" />
						<Skeleton className="h-8 w-8" />
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-6 w-32" />
					</div>
					<div className="flex items-center gap-1">
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-8 w-16" />
						<Skeleton className="h-8 w-16" />
					</div>
				</div>
			</div>

			{/* Calendar grid skeleton */}
			<div className="p-4">
				{/* Week days */}
				<div className="grid grid-cols-7 mb-4">
					{Array.from({ length: 7 }).map((_, i) => (
						<Skeleton key={i} className="h-6 w-12 mx-auto" />
					))}
				</div>

				{/* Calendar cells */}
				<div className="grid grid-cols-7 gap-1">
					{Array.from({ length: 42 }).map((_, i) => (
						<div key={i} className="min-h-[120px] p-2 border border-border rounded">
							<Skeleton className="h-4 w-6 mb-2" />
							<div className="space-y-1">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
