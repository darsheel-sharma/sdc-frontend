export const FEED_TYPES = ["hackathon", "job", "project"] as const;

export type FeedType = (typeof FEED_TYPES)[number];
export type FeedFilter = "all" | FeedType;

export const FEED_TYPE_LABELS: Record<FeedType, string> = {
  hackathon: "Hackathon",
  job: "Job",
  project: "Project",
};

export const FEED_FILTERS: FeedFilter[] = ["all", ...FEED_TYPES];
