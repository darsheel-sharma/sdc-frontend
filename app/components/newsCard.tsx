"use client";

import { useState } from "react";

type PostKind = "Post" | "Video" | "Photo" | "Article";

type Post = {
  id: string;
  author: string;
  headline: string;
  content: string;
  kind: PostKind;
  createdAt: string;
  likes: number;
  comments: number;
  reposts: number;
  attachmentTitle?: string;
};

const starterPosts: Post[] = [
  {
    id: "seed-1",
    author: "Chemical Engineering, IIT Madras",
    headline: "1d",
    content:
      "Department of Chemical Engineering welcomes Dr. Hariprasad Kodamana for a colloquium on resource-aware control in AI systems. Everyone is invited.",
    kind: "Article",
    createdAt: "1d",
    likes: 42,
    comments: 9,
    reposts: 5,
    attachmentTitle: "Chemical Engineering Colloquium - Event Flyer",
  },
  {
    id: "seed-2",
    author: "SDC Community Team",
    headline: "3h",
    content:
      "Hackathon opportunity is live. Looking for frontend engineers, backend engineers, and designers. Drop a comment with your stack.",
    kind: "Post",
    createdAt: "3h",
    likes: 21,
    comments: 14,
    reposts: 2,
  },
];

export default function NewsCard() {
  const [posts] = useState<Post[]>(starterPosts);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-3 border-t border-[#1c1b20]/10 pt-2 text-right text-xs font-semibold text-[#1c1b20]/60">
        Sort by: Top
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
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
                    {post.createdAt} • {post.kind}
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

            <p className="mt-3 text-sm leading-relaxed text-[#1c1b20]/85">{post.content}</p>

            {post.attachmentTitle ? (
              <div className="mt-3 rounded-lg border border-[#1c1b20]/15 bg-[#f3f1ef] p-3 text-sm font-medium text-[#1c1b20]/80">
                {post.attachmentTitle}
              </div>
            ) : null}

            <div className="mt-4 border-t border-[#1c1b20]/10 pt-3 text-xs text-[#1c1b20]/60">
              {post.likes} likes • {post.comments} comments • {post.reposts} reposts
            </div>

            <div className="mt-2 grid grid-cols-4 gap-2">
              {["Like", "Comment", "Repost", "Send"].map((action) => (
                <button
                  key={`${post.id}-${action}`}
                  type="button"
                  className="rounded-md py-2 text-sm font-semibold text-[#1c1b20]/75 transition hover:bg-[#f2f0ef]"
                >
                  {action}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
