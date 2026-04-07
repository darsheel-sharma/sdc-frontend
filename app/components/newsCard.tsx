"use client";

import { useEffect, useState } from "react";
import { generateSummary } from "@/gemini";

interface User {
  id: string;
  name: string;
  email?: string;
}

interface Article {
  source: {
    id: string | null;
    name: string;
  };
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  urlToImage: string | null;
}

export default function NewsCard({ article }: { article: Article }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">(
    "idle",
  );

  const persistArticle = async (summaryToSave?: string | null) => {
    if (!user?.id || loading) {
      setSaveStatus("error");
      return false;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const res = await fetch(`${apiUrl}/library/save-article`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        article,
        aiSummary: summaryToSave,
      }),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      setSaveStatus("saved");
      return true;
    }

    setSaveStatus("error");
    return false;
  };

  const handleSummary = async () => {
    if (summary) return summary;

    setIsLoading(true);

    const result = await generateSummary(
      article.title,
      article.description,
      article.content,
    );

    if (result.success) {
      const nextSummary = result.summary || null;
      setSummary(nextSummary);

      if (saveStatus === "saved" && nextSummary) {
        try {
          await persistArticle(nextSummary);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setSummary(result.error || null);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    setSummary(null);
    setSaveStatus("idle");
  }, [article.url]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured.");
        }

        const res = await fetch(`${apiUrl}/auth/get-user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await persistArticle(summary);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="relative bg-white rounded-xl p-5 shadow-sm border border-[#1c1b20]/10 flex flex-col">
      <button
        onClick={handleSave}
        disabled={loading || isSaving || saveStatus === "saved"}
        className="absolute top-7 right-7 bg-white/90 backdrop-blur px-3 py-2 rounded-full shadow-md hover:scale-105 transition disabled:opacity-50"
        title={
          saveStatus === "error" ? "Could not save article" : "Save article"
        }
      >
        {isSaving ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
      </button>

      {article.urlToImage && (
        <img
          src={article.urlToImage}
          alt={article.title}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}

      <h2 className="text-lg font-bold leading-tight mb-4">{article.title}</h2>

      <div className="mb-6">
        {!summary ? (
          <button
            onClick={handleSummary}
            disabled={isLoading}
            className="group inline-flex items-center gap-2 rounded-full border border-[#1c1b20]/10 bg-[#1c1b20] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(28,27,32,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(28,27,32,0.22)] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f6c85f] transition group-hover:scale-110" />
            {isLoading ? "Generating Overview..." : "AI Overview"}
          </button>
        ) : (
          <div className="rounded-2xl border border-[#7da6c2]/25 bg-[linear-gradient(180deg,#f5f9fc_0%,#edf4f8_100%)] p-4 text-sm leading-relaxed text-[#20303b] shadow-sm">
            <span className="font-bold block mb-1">AI Summary:</span>
            {summary}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {article.source.name}
        </span>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold bg-[#1c1b20] text-white px-4 py-2 rounded-full hover:bg-gray-800 transition"
        >
          Read Full Article
        </a>
      </div>
    </article>
  );
}
