type UnknownRecord = Record<string, unknown>;

export type AuthUser = {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value === "object" && value !== null) {
    return value as UnknownRecord;
  }
  return null;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function extractUserFromRecord(record: UnknownRecord | null): AuthUser | null {
  if (!record) return null;

  // We only keep the fields the frontend actually uses to stay nice and small :-)
  const user: AuthUser = {
    id: firstString(record.id, record._id, record.userId, record.sub),
    name: firstString(
      record.name,
      record.fullName,
      record.full_name,
      record.username,
      record.displayName,
      record.given_name,
    ),
    email: firstString(record.email, record.mail),
    image: firstString(
      record.image,
      record.avatar,
      record.avatarUrl,
      record.picture,
    ),
  };

  if (user.id || user.name || user.email || user.image) {
    return user;
  }

  return null;
}

export function extractToken(value: unknown): string | null {
  const root = asRecord(value);
  if (!root) return null;

  // Different auth endpoints can nest the token under different keys,
  // so we check the common direct and wrapped variants.
  const directCandidates = [
    root.token,
    root.accessToken,
    root.access_token,
    root.jwt,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  const nested = asRecord(root.data) ?? asRecord(root.result);
  if (!nested) return null;

  const nestedCandidates = [
    nested.token,
    nested.accessToken,
    nested.access_token,
    nested.jwt,
  ];

  for (const candidate of nestedCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return null;
}

export function extractUser(value: unknown): AuthUser | null {
  const root = asRecord(value);
  if (!root) return null;

  // The backend user payload may arrive as user/profile/data/result,
  // so we walk through the common containers and normalize once.
  const candidates = [
    asRecord(root.user),
    asRecord(root.profile),
    asRecord(root.me),
    asRecord(root.data),
    asRecord(root.result),
    root,
  ];

  for (const candidate of candidates) {
    const extracted =
      extractUserFromRecord(asRecord(candidate?.user)) ??
      extractUserFromRecord(asRecord(candidate?.profile)) ??
      extractUserFromRecord(candidate);

    if (extracted) {
      return extracted;
    }
  }

  return null;
}

export function extractUserFromToken(token: string): AuthUser | null {
  const parts = token.split(".");
  if (parts.length < 2 || typeof window === "undefined") return null;

  try {
    // Client-side JWT decoding is just a convenience fallback, not a trust boundary.
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const decoded = window.atob(payload);
    const parsed = JSON.parse(decoded) as unknown;

    return extractUser(parsed);
  } catch {
    return null;
  }
}

export async function parseApiBody(res: Response) {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Some backend errors arrive as plain text, so we wrap them into an object.
    return { message: text } as UnknownRecord;
  }
}
