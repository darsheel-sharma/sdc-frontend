"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  FEED_FILTERS,
  FEED_TYPE_LABELS,
  type FeedFilter,
} from "@/app/lib/feedTypes";

const normalizeFilter = (value: string | null): FeedFilter => {
  if (!value) {
    return "all";
  }

  const normalized = value.trim().toLowerCase();

  if (FEED_FILTERS.includes(normalized as FeedFilter)) {
    return normalized as FeedFilter;
  }

  return "all";
};

const filterLabel = (filter: FeedFilter) => {
  if (filter === "all") {
    return "All";
  }

  return FEED_TYPE_LABELS[filter];
};

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter = normalizeFilter(searchParams.get("type"));

  const handleFilterChange = (filter: FeedFilter) => {
    if (filter === "all") {
      router.push("/home");
      return;
    }

    const params = new URLSearchParams({ type: filter });
    router.push(`/home?${params.toString()}`);
  };

  return (
    <section className="mx-auto mb-6 w-full max-w-3xl rounded-2xl border border-[#1c1b20]/10 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1c1b20]/60">
        Feed Filter
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEED_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => handleFilterChange(filter)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === filter
                ? "bg-[#1c1b20] text-white shadow-[0_6px_16px_rgba(28,27,32,0.2)]"
                : "border border-[#1c1b20]/15 bg-[#f7f5f3] text-[#1c1b20] hover:bg-[#ece7e3]"
            }`}
          >
            {filterLabel(filter)}
          </button>
        ))}
      </div>
    </section>
  );
}
