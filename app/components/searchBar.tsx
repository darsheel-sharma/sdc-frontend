"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("query") || "";
  const [query, setQuery] = useState(searchQuery);

  const categories = ["Technology", "Science", "Finance", "Sports", "Health"];

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const navigateToResults = (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      router.push("/home");
      return;
    }

    const params = new URLSearchParams({ query: trimmedQuery });
    router.push(`/home?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigateToResults(query);
  };

  const handleCategories = (category: string) => {
    setQuery(category);
    navigateToResults(category);
  };

  return (
    <div className="mb-8 w-full">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search global news..."
          className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#1c1b20] text-[#1c1b20]"
        />
        <button
          type="submit"
          className="bg-[#1c1b20] text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          Search
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setQuery("");
            router.push("/home");
          }}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            !searchQuery
              ? "bg-[#1c1b20] text-white"
              : "bg-white text-[#1c1b20] border border-gray-300 hover:bg-gray-100"
          }`}
        >
          Top Headlines
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategories(category)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              searchQuery.toLowerCase() === category.toLowerCase()
                ? "bg-[#1c1b20] text-white"
                : "bg-white text-[#1c1b20] border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
