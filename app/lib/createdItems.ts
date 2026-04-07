export type CreatedCollectionKey =
  | "createdProjects"
  | "createdHackathons"
  | "createdJobs";

export type CreatedItem = {
  id: string;
  title: string;
  description: string;
  author: string;
};

type CreatedItemsStore = Record<CreatedCollectionKey, CreatedItem[]>;

const STORAGE_KEY = "created-items";

const emptyStore: CreatedItemsStore = {
  createdProjects: [],
  createdHackathons: [],
  createdJobs: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeItem(value: unknown): CreatedItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.title !== "string") return null;
  if (typeof value.description !== "string") return null;
  if (typeof value.author !== "string") return null;

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    author: value.author,
  };
}

export function readCreatedItems(): CreatedItemsStore {
  if (typeof window === "undefined") {
    return emptyStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyStore;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return emptyStore;

    return {
      createdProjects: Array.isArray(parsed.createdProjects)
        ? parsed.createdProjects.map(normalizeItem).filter((item): item is CreatedItem => Boolean(item))
        : [],
      createdHackathons: Array.isArray(parsed.createdHackathons)
        ? parsed.createdHackathons.map(normalizeItem).filter((item): item is CreatedItem => Boolean(item))
        : [],
      createdJobs: Array.isArray(parsed.createdJobs)
        ? parsed.createdJobs.map(normalizeItem).filter((item): item is CreatedItem => Boolean(item))
        : [],
    };
  } catch {
    return emptyStore;
  }
}

export function saveCreatedItem(key: CreatedCollectionKey, item: CreatedItem) {
  if (typeof window === "undefined") return;

  const current = readCreatedItems();
  const nextItems = current[key].some((entry) => entry.id === item.id)
    ? current[key]
    : [item, ...current[key]];

  const next: CreatedItemsStore = {
    ...current,
    [key]: nextItems,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
