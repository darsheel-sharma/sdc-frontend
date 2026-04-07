"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/navbar";
import { getApiBaseUrl } from "@/app/lib/apiBaseUrl";
import { readCreatedItems, saveCreatedItem } from "@/app/lib/createdItems";
import { readJoinedItems } from "@/app/lib/joinedItems";
import {
  extractUser,
  extractUserFromToken,
  parseApiBody,
  type AuthUser,
} from "@/app/lib/authResponse";

type UnknownRecord = Record<string, unknown>;

type CollectionItem = {
  id: string;
  title: string;
  description: string;
};

type CollectionKey =
  | "joinedProjects"
  | "createdProjects"
  | "joinedHackathons"
  | "createdHackathons"
  | "joinedJobs"
  | "createdJobs";

type ProfileData = {
  name: string;
  email?: string;
  bio: string;
  skills: string[];
  joinedProjects: CollectionItem[];
  createdProjects: CollectionItem[];
  joinedHackathons: CollectionItem[];
  createdHackathons: CollectionItem[];
  joinedJobs: CollectionItem[];
  createdJobs: CollectionItem[];
};

type SectionMeta = {
  key: CollectionKey;
  title: string;
  emptyLabel: string;
  emptyHint: string;
  addLabel: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
};

const profileSections: SectionMeta[] = [
  {
    key: "joinedProjects",
    title: "Joined Projects",
    emptyLabel: "Join Projects",
    emptyHint: "Join projects from Home.",
    addLabel: "Add Joined Project",
    titlePlaceholder: "Project name",
    descriptionPlaceholder: "What project did you join?",
  },
  {
    key: "joinedHackathons",
    title: "Joined Hackathons",
    emptyLabel: "Join Hackathons",
    emptyHint: "Join hackathons from Home.",
    addLabel: "Add Joined Hackathon",
    titlePlaceholder: "Hackathon name",
    descriptionPlaceholder: "What hackathon did you join?",
  },
  {
    key: "joinedJobs",
    title: "Joined Jobs",
    emptyLabel: "Join Jobs",
    emptyHint: "Join jobs from Home.",
    addLabel: "Add Joined Job",
    titlePlaceholder: "Job title",
    descriptionPlaceholder: "What role or opportunity did you join?",
  },
  {
    key: "createdProjects",
    title: "Created Projects",
    emptyLabel: "Create Projects",
    emptyHint: "Create a new project here.",
    addLabel: "Add Created Project",
    titlePlaceholder: "Project name",
    descriptionPlaceholder: "What did you build or create?",
  },
  {
    key: "createdHackathons",
    title: "Created Hackathons",
    emptyLabel: "Create Hackathons",
    emptyHint: "Create a new hackathon here.",
    addLabel: "Add Created Hackathon",
    titlePlaceholder: "Hackathon name",
    descriptionPlaceholder: "What hackathon did you organize or create?",
  },
  {
    key: "createdJobs",
    title: "Created Jobs",
    emptyLabel: "Create Jobs",
    emptyHint: "Create a new job opportunity here.",
    addLabel: "Add Created Job",
    titlePlaceholder: "Job title",
    descriptionPlaceholder: "What job or opportunity did you post?",
  },
];

const emptyProfile: ProfileData = {
  name: "Your Name",
  bio: "Your profile details will show here once they are available from the backend.",
  skills: [],
  joinedProjects: [],
  createdProjects: [],
  joinedHackathons: [],
  createdHackathons: [],
  joinedJobs: [],
  createdJobs: [],
};

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }

  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function pickArray(source: UnknownRecord | null, keys: string[]) {
  if (!source) return [];

  for (const key of keys) {
    const candidate = source[key];
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeSkills(value: unknown): string[] {
  return asArray(value)
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      const record = asRecord(item);
      return firstString(record?.name, record?.title, record?.label, record?.skill);
    })
    .filter((item): item is string => Boolean(item));
}

function normalizeItem(value: unknown, fallbackPrefix: string, index: number): CollectionItem | null {
  if (typeof value === "string" && value.trim()) {
    return {
      id: `${fallbackPrefix}-${index}-${value}`,
      title: value.trim(),
      description: "No description provided yet.",
    };
  }

  const record = asRecord(value);
  if (!record) return null;

  const title = firstString(
    record.title,
    record.name,
    record.projectName,
    record.hackathonName,
    record.jobTitle,
    record.role,
    record.company,
  );

  if (!title) return null;

  const description =
    firstString(
      record.description,
      record.summary,
      record.about,
      record.details,
      record.content,
      record.problemStatement,
    ) ?? "No description provided yet.";

  const id =
    firstString(
      record.id,
      record._id,
      record.slug,
      record.title,
      record.name,
    ) ?? `${fallbackPrefix}-${index}-${title}`;

  return { id, title, description };
}

function normalizeItems(list: unknown[], fallbackPrefix: string) {
  return list
    .map((item, index) => normalizeItem(item, fallbackPrefix, index))
    .filter((item): item is CollectionItem => Boolean(item));
}

function createCollectionItem(key: CollectionKey, title: string, description: string): CollectionItem {
  // Local item ids are enough here because these create flows are still client-first :-)
  return {
    id: `${key}-${Date.now()}`,
    title,
    description,
  };
}

function mergeUniqueItems(primary: CollectionItem[], secondary: CollectionItem[]) {
  const seen = new Set<string>();
  const merged: CollectionItem[] = [];

  for (const item of [...primary, ...secondary]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  return merged;
}

function lowerSet(values: Array<string | undefined>) {
  return new Set(values.filter(Boolean).map((value) => value!.toLowerCase()));
}

function matchesUser(value: unknown, identifiers: Set<string>) {
  if (typeof value === "string") {
    return identifiers.has(value.toLowerCase());
  }

  const record = asRecord(value);
  if (!record) return false;

  const candidates = [
    firstString(record.id, record._id, record.userId, record.sub, record.email, record.name),
  ];

  return candidates.some((candidate) => candidate && identifiers.has(candidate.toLowerCase()));
}

function isCreatedByUser(record: UnknownRecord, identifiers: Set<string>) {
  const directValues = [
    record.createdBy,
    record.owner,
    record.organizer,
    record.creator,
    record.author,
    record.postedBy,
    record.user,
  ];

  if (directValues.some((value) => matchesUser(value, identifiers))) {
    return true;
  }

  const directStrings = [
    firstString(
      record.createdById,
      record.ownerId,
      record.organizerId,
      record.creatorId,
      record.authorId,
      record.userId,
      record.email,
    ),
  ];

  return directStrings.some((value) => value && identifiers.has(value.toLowerCase()));
}

function splitCollectionByOwnership(
  list: unknown[],
  identifiers: Set<string>,
  fallbackPrefix: string,
) {
  const created: CollectionItem[] = [];
  const joined: CollectionItem[] = [];

  list.forEach((item, index) => {
    const normalized = normalizeItem(item, fallbackPrefix, index);
    if (!normalized) return;

    const record = asRecord(item);
    if (record && isCreatedByUser(record, identifiers)) {
      created.push(normalized);
    } else {
      joined.push(normalized);
    }
  });

  return { created, joined };
}

function extractProfileSource(data: unknown) {
  const root = asRecord(data);
  if (!root) return null;

  return (
    asRecord(root.user) ??
    asRecord(root.profile) ??
    asRecord(root.data)?.user ??
    asRecord(asRecord(root.data)?.profile) ??
    asRecord(root.data) ??
    asRecord(root.result)?.user ??
    asRecord(asRecord(root.result)?.profile) ??
    asRecord(root.result) ??
    root
  );
}

function buildProfile(data: unknown, fallbackUser: AuthUser | null): ProfileData {
  const source = extractProfileSource(data);
  const authUser = extractUser(data) ?? fallbackUser;
  const userSource = asRecord(source);

  // We normalize generously because the backend payload can evolve over time.
  const name =
    firstString(
      userSource?.name,
      userSource?.fullName,
      userSource?.username,
      authUser?.name,
      authUser?.email,
    ) ?? emptyProfile.name;

  const bio =
    firstString(
      userSource?.bio,
      userSource?.about,
      userSource?.description,
      userSource?.headline,
    ) ?? emptyProfile.bio;

  const skills = normalizeSkills(
    userSource?.skills ?? userSource?.techStack ?? userSource?.interests,
  );

  const identifiers = lowerSet([
    authUser?.id,
    authUser?.email,
    authUser?.name,
    firstString(userSource?.id, userSource?._id, userSource?.userId),
    firstString(userSource?.email),
  ]);

  const explicitJoinedProjects = normalizeItems(
    pickArray(userSource, ["joinedProjects", "projectsJoined"]),
    "joined-project",
  );
  const explicitCreatedProjects = normalizeItems(
    pickArray(userSource, ["createdProjects", "projectsCreated", "myProjects"]),
    "created-project",
  );
  const explicitJoinedHackathons = normalizeItems(
    pickArray(userSource, ["joinedHackathons", "hackathonsJoined"]),
    "joined-hackathon",
  );
  const explicitCreatedHackathons = normalizeItems(
    pickArray(userSource, ["createdHackathons", "hackathonsCreated"]),
    "created-hackathon",
  );
  const explicitJoinedJobs = normalizeItems(
    pickArray(userSource, ["joinedJobs", "appliedJobs", "jobsJoined", "opportunitiesJoined"]),
    "joined-job",
  );
  const explicitCreatedJobs = normalizeItems(
    pickArray(userSource, ["createdJobs", "postedJobs", "jobsCreated", "opportunitiesCreated"]),
    "created-job",
  );

  const projectFallback = splitCollectionByOwnership(
    pickArray(userSource, ["projects"]),
    identifiers,
    "project",
  );
  const hackathonFallback = splitCollectionByOwnership(
    pickArray(userSource, ["hackathons"]),
    identifiers,
    "hackathon",
  );
  const jobFallback = splitCollectionByOwnership(
    pickArray(userSource, ["jobs", "jobOpportunities", "opportunities"]),
    identifiers,
    "job",
  );

  return {
    name,
    email: firstString(userSource?.email, authUser?.email),
    bio,
    skills,
    joinedProjects:
      explicitJoinedProjects.length > 0 ? explicitJoinedProjects : projectFallback.joined,
    createdProjects:
      explicitCreatedProjects.length > 0 ? explicitCreatedProjects : projectFallback.created,
    joinedHackathons:
      explicitJoinedHackathons.length > 0
        ? explicitJoinedHackathons
        : hackathonFallback.joined,
    createdHackathons:
      explicitCreatedHackathons.length > 0
        ? explicitCreatedHackathons
        : hackathonFallback.created,
    joinedJobs: explicitJoinedJobs.length > 0 ? explicitJoinedJobs : jobFallback.joined,
    createdJobs: explicitCreatedJobs.length > 0 ? explicitCreatedJobs : jobFallback.created,
  };
}

function EmptyCollectionCard({
  title,
  actionLabel,
  hint,
  onAction,
  canAdd,
}: {
  title: string;
  actionLabel: string;
  hint: string;
  onAction: () => void;
  canAdd: boolean;
}) {
  if (!canAdd) {
    return (
      <div className="w-full rounded-xl border border-dashed border-[#1c1b20]/15 bg-white p-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f0ef] text-3xl text-[#1c1b20]">
          +
        </div>
        <h4 className="mt-3 text-sm font-semibold text-[#1c1b20]">
          No {title.toLowerCase()} yet
        </h4>
        <p className="mt-1 text-sm text-[#1c1b20]/65">{hint}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg bg-[#1c1b20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
        >
          {actionLabel}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAction}
      className="w-full rounded-xl border border-dashed border-[#1c1b20]/15 bg-white p-5 text-center transition hover:bg-[#f8f5f2]"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f0ef] text-3xl text-[#1c1b20]">
        +
      </div>
      <h4 className="mt-3 text-sm font-semibold text-[#1c1b20]">No {title.toLowerCase()} yet</h4>
      <p className="mt-1 text-sm text-[#1c1b20]/65">{hint}</p>
    </button>
  );
}

function CollectionCard({
  meta,
  title,
  items,
  emptyLabel,
  emptyHint,
  onAdd,
  canAdd,
}: {
  meta: SectionMeta;
  title: string;
  items: CollectionItem[];
  emptyLabel: string;
  emptyHint: string;
  onAdd: (key: CollectionKey) => void;
  canAdd: boolean;
}) {
  return (
    <article className="rounded-2xl border border-[#1c1b20]/10 bg-[#fcfbfa] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#1c1b20]">{title}</h3>
          <p className="text-sm text-[#1c1b20]/60">
            {items.length} {items.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        {canAdd ? (
          <button
            type="button"
            onClick={() => onAdd(meta.key)}
            className="rounded-lg bg-[#1c1b20] px-3 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
          >
            + Add
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#1c1b20]/10 bg-white p-4"
            >
              <h4 className="text-base font-bold text-[#1c1b20]">{item.title}</h4>
              <p className="mt-1 text-sm text-[#1c1b20]/75">{item.description}</p>
            </div>
          ))
        ) : (
          <EmptyCollectionCard
            title={title}
            actionLabel={emptyLabel}
            hint={emptyHint}
            onAction={() => onAdd(meta.key)}
            canAdd={canAdd}
          />
        )}
      </div>
    </article>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [activeAddSection, setActiveAddSection] = useState<SectionMeta | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [draftBio, setDraftBio] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const storedUserRaw = localStorage.getItem("auth-user");
      let storedUser: AuthUser | null = null;

      if (storedUserRaw) {
        try {
          storedUser = JSON.parse(storedUserRaw) as AuthUser;
        } catch {
          localStorage.removeItem("auth-user");
        }
      }

      const fallbackUser = storedUser ?? (token ? extractUserFromToken(token) : null);

      if (!token) {
        // Even without a token we try to show the soft cached identity if it exists.
        setProfile((prev) => ({
          ...prev,
          name: fallbackUser?.name ?? emptyProfile.name,
        }));
        setLoading(false);
        return;
      }

      try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/auth/get-user`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await parseApiBody(res);

        if (res.ok) {
          const backendProfile = buildProfile(data, fallbackUser);
          const joinedFromHome = readJoinedItems();
          const createdFromProfile = readCreatedItems();

          // Backend profile data is treated as the source of truth,
          // then we layer in local create/join actions for instant feedback.
          setProfile({
            ...backendProfile,
            joinedProjects: mergeUniqueItems(
              backendProfile.joinedProjects,
              joinedFromHome.joinedProjects,
            ),
            joinedHackathons: mergeUniqueItems(
              backendProfile.joinedHackathons,
              joinedFromHome.joinedHackathons,
            ),
            joinedJobs: mergeUniqueItems(
              backendProfile.joinedJobs,
              joinedFromHome.joinedJobs,
            ),
            createdProjects: mergeUniqueItems(
              backendProfile.createdProjects,
              createdFromProfile.createdProjects,
            ),
            createdHackathons: mergeUniqueItems(
              backendProfile.createdHackathons,
              createdFromProfile.createdHackathons,
            ),
            createdJobs: mergeUniqueItems(
              backendProfile.createdJobs,
              createdFromProfile.createdJobs,
            ),
          });
        } else {
          setProfile((prev) => ({
            ...prev,
            name: fallbackUser?.name ?? prev.name,
            email: fallbackUser?.email ?? prev.email,
            joinedProjects: mergeUniqueItems(prev.joinedProjects, readJoinedItems().joinedProjects),
            joinedHackathons: mergeUniqueItems(
              prev.joinedHackathons,
              readJoinedItems().joinedHackathons,
            ),
            joinedJobs: mergeUniqueItems(prev.joinedJobs, readJoinedItems().joinedJobs),
            createdProjects: mergeUniqueItems(
              prev.createdProjects,
              readCreatedItems().createdProjects,
            ),
            createdHackathons: mergeUniqueItems(
              prev.createdHackathons,
              readCreatedItems().createdHackathons,
            ),
            createdJobs: mergeUniqueItems(prev.createdJobs, readCreatedItems().createdJobs),
          }));
        }
      } catch (error) {
        console.error(error);
        setProfile((prev) => ({
          ...prev,
          name: fallbackUser?.name ?? prev.name,
          email: fallbackUser?.email ?? prev.email,
          joinedProjects: mergeUniqueItems(prev.joinedProjects, readJoinedItems().joinedProjects),
          joinedHackathons: mergeUniqueItems(
            prev.joinedHackathons,
            readJoinedItems().joinedHackathons,
          ),
          joinedJobs: mergeUniqueItems(prev.joinedJobs, readJoinedItems().joinedJobs),
          createdProjects: mergeUniqueItems(
            prev.createdProjects,
            readCreatedItems().createdProjects,
          ),
          createdHackathons: mergeUniqueItems(
            prev.createdHackathons,
            readCreatedItems().createdHackathons,
          ),
          createdJobs: mergeUniqueItems(prev.createdJobs, readCreatedItems().createdJobs),
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const initials = useMemo(() => {
    const parts = profile.name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase());

    return parts.length > 0 ? parts.join("") : "U";
  }, [profile.name]);

  const totalJoined =
    profile.joinedProjects.length +
    profile.joinedHackathons.length +
    profile.joinedJobs.length;
  const totalCreated =
    profile.createdProjects.length +
    profile.createdHackathons.length +
    profile.createdJobs.length;

  const joinedSections = profileSections.filter((section) =>
    section.key.startsWith("joined"),
  );
  const createdSections = profileSections.filter((section) =>
    section.key.startsWith("created"),
  );

  const openAddModal = (key: CollectionKey) => {
    const isJoinedSection = key.startsWith("joined");
    if (isJoinedSection) {
      // Joined items should be requested from Home, not created from Profile.
      router.push("/home");
      return;
    }

    const section = profileSections.find((item) => item.key === key) ?? null;
    setActiveAddSection(section);
    setDraftTitle("");
    setDraftDescription("");
  };

  const closeAddModal = () => {
    setActiveAddSection(null);
    setDraftTitle("");
    setDraftDescription("");
  };

  const handleAddItem = () => {
    if (!activeAddSection) return;

    const title = draftTitle.trim();
    const description = draftDescription.trim();

    if (!title || !description) return;

    const newItem = createCollectionItem(activeAddSection.key, title, description);
    if (
      activeAddSection.key === "createdProjects" ||
      activeAddSection.key === "createdHackathons" ||
      activeAddSection.key === "createdJobs"
    ) {
      // Created opportunities are also pushed into a shared local store
      // so they appear on the home feed immediately.
      saveCreatedItem(activeAddSection.key, {
        ...newItem,
        author: profile.name,
      });
    }

    setProfile((prev) => ({
      ...prev,
      [activeAddSection.key]: [newItem, ...prev[activeAddSection.key]],
    }));
    closeAddModal();
  };

  const openBioModal = () => {
    setDraftBio(profile.bio);
    setIsBioModalOpen(true);
  };

  const closeBioModal = () => {
    setIsBioModalOpen(false);
    setDraftBio("");
  };

  const saveBio = () => {
    const nextBio = draftBio.trim();
    if (!nextBio) return;

    // Local bio editing keeps the account page pleasant while backend save is still pending :-)
    setProfile((prev) => ({
      ...prev,
      bio: nextBio,
    }));
    closeBioModal();
  };

  return (
    <div className="min-h-screen bg-[#F2F0EF] text-[#1c1b20]">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1c1b20] text-xl font-bold text-white">
              {initials}
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">My Account</h1>
                <div className="rounded-full border border-[#1c1b20]/10 bg-[#fcfbfa] px-3 py-1 text-xs font-semibold text-[#1c1b20]/70">
                  {loading ? "Syncing profile..." : "Connected to backend"}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1c1b20]/55">
                  Name
                </p>
                <p className="mt-1 text-lg font-semibold text-[#1c1b20]">{profile.name}</p>
              </div>

              {profile.email ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1c1b20]/55">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-[#1c1b20]/75">{profile.email}</p>
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1c1b20]/55">
                    Bio
                  </p>
                  <button
                    type="button"
                    onClick={openBioModal}
                    className="rounded-lg border border-[#1c1b20]/15 px-3 py-1 text-xs font-semibold text-[#1c1b20] hover:bg-[#f5f2ef]"
                  >
                    Edit Bio
                  </button>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#1c1b20]/80">
                  {profile.bio}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#1c1b20]/10 bg-[#fcfbfa] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1c1b20]/55">
                Joined
              </p>
              <p className="mt-2 text-2xl font-bold">{totalJoined}</p>
              <p className="mt-1 text-sm text-[#1c1b20]/70">
                Projects, hackathons, and jobs this user has joined.
              </p>
            </div>
            <div className="rounded-xl border border-[#1c1b20]/10 bg-[#fcfbfa] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1c1b20]/55">
                Created
              </p>
              <p className="mt-2 text-2xl font-bold">{totalCreated}</p>
              <p className="mt-1 text-sm text-[#1c1b20]/70">
                Projects, hackathons, and jobs this user created.
              </p>
            </div>
            <div className="rounded-xl border border-[#1c1b20]/10 bg-[#fcfbfa] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1c1b20]/55">
                Skills
              </p>
              <p className="mt-2 text-2xl font-bold">{profile.skills.length}</p>
              <p className="mt-1 text-sm text-[#1c1b20]/70">
                Skills loaded from the current user profile.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Skills</h2>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.length > 0 ? (
              profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full border border-[#1c1b20]/15 bg-[#f5f2ef] px-3 py-1 text-sm font-semibold"
                >
                  {skill}
                </span>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[#1c1b20]/15 bg-[#fcfbfa] p-5 text-sm text-[#1c1b20]/65">
                No skills were returned from the backend for this user yet.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Joined</h2>
            <p className="text-sm text-[#1c1b20]/65">
              Projects, hackathons, and jobs the user has joined from backend data.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {joinedSections.map((section) => (
              <CollectionCard
                key={section.key}
                meta={section}
                title={section.title}
                items={profile[section.key]}
                emptyLabel={section.emptyLabel}
                emptyHint={section.emptyHint}
                onAdd={openAddModal}
                canAdd={false}
              />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Created</h2>
            <p className="text-sm text-[#1c1b20]/65">
              Projects, hackathons, and jobs the user created from backend data.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {createdSections.map((section) => (
              <CollectionCard
                key={section.key}
                meta={section}
                title={section.title}
                items={profile[section.key]}
                emptyLabel={section.emptyLabel}
                emptyHint={section.emptyHint}
                onAdd={openAddModal}
                canAdd={true}
              />
            ))}
          </div>
        </section>
      </main>

      {activeAddSection ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#1c1b20]">{activeAddSection.addLabel}</h2>
            <p className="mt-1 text-sm text-[#1c1b20]/65">
              Add a new item to this section from your profile page.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={activeAddSection.titlePlaceholder}
                className="w-full rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
              />
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={4}
                placeholder={activeAddSection.descriptionPlaceholder}
                className="w-full resize-none rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-lg border border-[#1c1b20]/20 px-4 py-2 text-sm font-semibold text-[#1c1b20] hover:bg-[#f5f2ef]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="rounded-lg bg-[#1c1b20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isBioModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-[#1c1b20]">Edit Bio</h2>
            <p className="mt-1 text-sm text-[#1c1b20]/65">
              Update how this user is introduced on the profile page.
            </p>

            <div className="mt-4">
              <textarea
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                rows={5}
                placeholder="Write a short bio"
                className="w-full resize-none rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeBioModal}
                className="rounded-lg border border-[#1c1b20]/20 px-4 py-2 text-sm font-semibold text-[#1c1b20] hover:bg-[#f5f2ef]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveBio}
                className="rounded-lg bg-[#1c1b20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
              >
                Save Bio
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
