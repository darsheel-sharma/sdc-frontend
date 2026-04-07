export type JoinedCollectionKey =
  | "joinedProjects"
  | "joinedHackathons"
  | "joinedJobs";

export type JoinedItem = {
  id: string;
  title: string;
  description: string;
};

type JoinedItemsStore = Record<JoinedCollectionKey, JoinedItem[]>;

const STORAGE_KEY = "joined-items";

const emptyStore: JoinedItemsStore = {
  joinedProjects: [],
  joinedHackathons: [],
  joinedJobs: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeItem(value: unknown): JoinedItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.title !== "string") return null;
  if (typeof value.description !== "string") return null;

  return {
    id: value.id,
    title: value.title,
    description: value.description,
  };
}

export function readJoinedItems(): JoinedItemsStore {
  if (typeof window === "undefined") {
    return emptyStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return emptyStore;

    return {
      joinedProjects: Array.isArray(parsed.joinedProjects)
        ? parsed.joinedProjects.map(normalizeItem).filter((item): item is JoinedItem => Boolean(item))
        : [],
      joinedHackathons: Array.isArray(parsed.joinedHackathons)
        ? parsed.joinedHackathons.map(normalizeItem).filter((item): item is JoinedItem => Boolean(item))
        : [],
      joinedJobs: Array.isArray(parsed.joinedJobs)
        ? parsed.joinedJobs.map(normalizeItem).filter((item): item is JoinedItem => Boolean(item))
        : [],
    };
  } catch {
    return emptyStore;
  }
}

export function saveJoinedItem(key: JoinedCollectionKey, item: JoinedItem) {
  if (typeof window === "undefined") return;

  const current = readJoinedItems();
  const nextItems = current[key].some((entry) => entry.id === item.id)
    ? current[key]
    : [item, ...current[key]];

  const next: JoinedItemsStore = {
    ...current,
    [key]: nextItems,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
