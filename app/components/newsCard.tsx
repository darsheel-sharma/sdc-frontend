"use client";

import { useState } from "react";
import { readCreatedItems } from "@/app/lib/createdItems";
import { readJoinedItems, saveJoinedItem } from "@/app/lib/joinedItems";

type PostKind = "Post" | "Video" | "Photo" | "Article";
type OpportunityType = "project" | "hackathon" | "job";

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
  opportunityType?: OpportunityType;
};

// Starter posts keep the feed useful while backend community posts are still mocked :-)
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
    opportunityType: "hackathon",
  },
  {
    id: "seed-3",
    author: "BuildSpace Projects",
    headline: "5h",
    content:
      "Project opportunity is open for a product-minded frontend developer and one backend engineer. Join if you want to ship a real collaboration platform.",
    kind: "Post",
    createdAt: "5h",
    likes: 16,
    comments: 8,
    reposts: 1,
    opportunityType: "project",
  },
  {
    id: "seed-4",
    author: "Talent Circle",
    headline: "7h",
    content:
      "Job opportunity for a React intern is now live. We are looking for someone comfortable with components, APIs, and responsive UI work.",
    kind: "Post",
    createdAt: "7h",
    likes: 12,
    comments: 5,
    reposts: 1,
    opportunityType: "job",
  },
];

function joinLabel(type: OpportunityType) {
  if (type === "hackathon") return "Join Hackathon";
  if (type === "project") return "Join Project";
  return "Join Job";
}

function buildCreatedPosts(): Post[] {
  const created = readCreatedItems();

  // Newly created opportunities are stored locally first so the home feed
  // can surface them immediately without waiting for backend persistence.
  return [
    // Each created item is converted into the same post shape the feed already understands.
    ...created.createdHackathons.map((item, index) => ({
      id: item.id,
      author: item.author,
      headline: "now",
      content: item.description,
      kind: "Post" as const,
      createdAt: `new ${index + 1}`,
      likes: 0,
      comments: 0,
      reposts: 0,
      attachmentTitle: item.title,
      opportunityType: "hackathon" as const,
    })),
    ...created.createdProjects.map((item, index) => ({
      id: item.id,
      author: item.author,
      headline: "now",
      content: item.description,
      kind: "Post" as const,
      createdAt: `new ${index + 1}`,
      likes: 0,
      comments: 0,
      reposts: 0,
      attachmentTitle: item.title,
      opportunityType: "project" as const,
    })),
    ...created.createdJobs.map((item, index) => ({
      id: item.id,
      author: item.author,
      headline: "now",
      content: item.description,
      kind: "Post" as const,
      createdAt: `new ${index + 1}`,
      likes: 0,
      comments: 0,
      reposts: 0,
      attachmentTitle: item.title,
      opportunityType: "job" as const,
    })),
  ];
}

export default function NewsCard() {
  // Build once on mount so the feed feels stable while the user interacts with it.
  const [posts] = useState<Post[]>(() => [...buildCreatedPosts(), ...starterPosts]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [joinedIds, setJoinedIds] = useState<string[]>(() => {
    // Request state is restored from local storage so Home and My Account stay in sync :-)
    const joined = readJoinedItems();
    return [
      ...joined.joinedProjects.map((item) => item.id),
      ...joined.joinedHackathons.map((item) => item.id),
      ...joined.joinedJobs.map((item) => item.id),
    ];
  });

  const openJoinModal = (post: Post) => {
    // Clear the mini request form every time we open a fresh opportunity.
    setSelectedPost(post);
    setName("");
    setMessage("");
  };

  const closeJoinModal = () => {
    setSelectedPost(null);
    setName("");
    setMessage("");
  };

  const handleJoin = () => {
    if (!selectedPost || !selectedPost.opportunityType) return;

    const key =
      selectedPost.opportunityType === "project"
        ? "joinedProjects"
        : selectedPost.opportunityType === "hackathon"
          ? "joinedHackathons"
          : "joinedJobs";

    // Join requests are mirrored into shared local storage so My Account
    // can reflect them as soon as the user leaves the home feed.
    saveJoinedItem(key, {
      id: selectedPost.id,
      title: selectedPost.attachmentTitle ?? selectedPost.author,
      description: selectedPost.content,
    });

    setJoinedIds((prev) =>
      prev.includes(selectedPost.id) ? prev : [selectedPost.id, ...prev],
    );
    closeJoinModal();
  };

  return (
    <>
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-3 flex items-center justify-between border-t border-[#1c1b20]/10 pt-2">
          <p className="text-xs font-semibold text-[#1c1b20]/60">
            Join projects, hackathons, and jobs from Home.
          </p>
          <div className="text-right text-xs font-semibold text-[#1c1b20]/60">
            Sort by: Top
          </div>
        </div>

        <div className="space-y-4">
          {posts.map((post) => {
            const isJoined = joinedIds.includes(post.id);

            return (
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

                <div
                  className={`mt-2 grid gap-2 ${
                    post.opportunityType ? "grid-cols-5" : "grid-cols-4"
                  }`}
                >
                  {["Like", "Comment", "Repost", "Send"].map((action) => (
                    <button
                      key={`${post.id}-${action}`}
                      type="button"
                      className="rounded-md py-2 text-sm font-semibold text-[#1c1b20]/75 transition hover:bg-[#f2f0ef]"
                    >
                      {action}
                    </button>
                  ))}

                  {post.opportunityType ? (
                    <button
                      type="button"
                      onClick={() => openJoinModal(post)}
                      disabled={isJoined}
                      className={`rounded-md py-2 text-sm font-semibold transition ${
                        isJoined
                          ? "bg-[#dfe9df] text-[#2f6b39]"
                          : "bg-[#1c1b20] text-white hover:bg-[#2b2a32]"
                      }`}
                    >
                      {isJoined ? "Request Sent" : joinLabel(post.opportunityType)}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedPost?.opportunityType ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#1c1b20]">
              {joinLabel(selectedPost.opportunityType)}
            </h2>
            <p className="mt-1 text-sm text-[#1c1b20]/65">
              Send a quick request to join this opportunity from Home.
            </p>

            <div className="mt-4 rounded-xl border border-[#1c1b20]/10 bg-[#fcfbfa] p-4">
              <p className="text-sm font-semibold text-[#1c1b20]">{selectedPost.author}</p>
              <p className="mt-1 text-sm text-[#1c1b20]/75">{selectedPost.content}</p>
            </div>

            <div className="mt-4 grid gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Tell them why you want to join"
                className="w-full resize-none rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeJoinModal}
                className="rounded-lg border border-[#1c1b20]/20 px-4 py-2 text-sm font-semibold text-[#1c1b20] hover:bg-[#f5f2ef]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoin}
                className="rounded-lg bg-[#1c1b20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
              >
                Confirm Join
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
