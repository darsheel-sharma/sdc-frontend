"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FEED_TYPES,
  FEED_TYPE_LABELS,
  type FeedFilter,
  type FeedType,
} from "@/app/lib/feedTypes";

type FeedItem = {
  id: string;
  author: string;
  title: string;
  content: string;
  type: FeedType;
  createdAt: string;
};

type OpportunityResponseItem = {
  _id?: string;
  id?: string;
  title?: string;
  desc?: string;
  description?: string;
  type?: string;
  createdAt?: string;
  postedBy?: {
    name?: string;
  };
};

const starterPosts: FeedItem[] = [
  {
    id: "seed-1",
    author: "SDC Community Team",
    title: "BuildSprint registration open",
    content:
      "Hackathon applications are live for BuildSprint. Teams of 2-4 can register before Friday midnight.",
    type: "hackathon",
    createdAt: "1d",
  },
  {
    id: "seed-2",
    author: "Career Cell",
    title: "Frontend internship drive",
    content:
      "Job openings available for React and Next.js developers. Shortlisted candidates will get interviews this week.",
    type: "job",
    createdAt: "3h",
  },
  {
    id: "seed-3",
    author: "Project Board",
    title: "Need teammate for AI summarizer",
    content:
      "Project team is looking for one frontend and one backend contributor for the AI summarizer MVP.",
    type: "project",
    createdAt: "30m",
  },
];

const normalizeType = (value?: string): FeedType => {
  const normalized = value?.trim().toLowerCase();

  if (normalized && FEED_TYPES.includes(normalized as FeedType)) {
    return normalized as FeedType;
  }

  return "project";
};

const normalizeFilter = (value: string | null): FeedFilter => {
  if (!value) {
    return "all";
  }

  const normalized = value.trim().toLowerCase();

  if (FEED_TYPES.includes(normalized as FeedType)) {
    return normalized as FeedType;
  }

  return "all";
};

const formatCreatedAt = (value?: string) => {
  if (!value) {
    return "now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const mapOpportunityToFeedItem = (
  item: OpportunityResponseItem,
  index: number,
): FeedItem => ({
  id: item._id || item.id || `api-${index}`,
  author: item.postedBy?.name || "Community",
  title: item.title || "Untitled",
  content: item.desc || item.description || "",
  type: normalizeType(item.type),
  createdAt: formatCreatedAt(item.createdAt),
});

export default function NewsCard() {
  const [posts] = useState<Post[]>(starterPosts);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-3 border-t border-[#1c1b20]/10 pt-2 text-right text-xs font-semibold text-[#1c1b20]/60">
        Sort by: Top
      </div>

      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="rounded-xl border border-[#1c1b20]/10 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#efe8df] text-xs font-bold text-[#1c1b20]">
                  {post.author.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold text-[#1c1b20]">{post.author}</p>
                  <p className="text-xs text-[#1c1b20]/60">
                    {post.createdAt} • {FEED_TYPE_LABELS[post.type]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-[#1c1b20]/60 hover:bg-[#f2f0ef]"
              >
                ...
              </button>
            </div>

            <h3 className="mt-3 text-base font-bold text-[#1c1b20]">{post.title}</h3>

            <p className="mt-3 text-sm leading-relaxed text-[#1c1b20]/85">{post.content}</p>

            <span className="mt-3 inline-flex rounded-full bg-[#f2f0ef] px-3 py-1 text-xs font-semibold text-[#1c1b20]/80">
              {FEED_TYPE_LABELS[post.type]}
            </span>

            <div className="mt-4 flex items-center justify-between border-t border-[#1c1b20]/10 pt-3">
              <p className="text-xs font-semibold text-[#1c1b20]/60">
                {post.type === "job" ? "Open role" : "Open team slots"}
              </p>
              <button
                type="button"
                onClick={() => handleJoinOpportunity(post.id)}
                disabled={Boolean(joinedMap[post.id])}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  joinedMap[post.id]
                    ? "cursor-not-allowed bg-[#e9f8ee] text-[#1e7a3e]"
                    : "bg-[#1c1b20] text-white hover:bg-[#2b2a32]"
                }`}
              >
                {joinedMap[post.id]
                  ? post.type === "hackathon"
                    ? "Joined!"
                    : "Applied!"
                  : "Join Opportunity"}
              </button>
            </div>
          </article>
        ))}

        {!loading && filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#1c1b20]/20 bg-white p-8 text-center text-sm text-[#1c1b20]/70">
            No items found for this filter yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
