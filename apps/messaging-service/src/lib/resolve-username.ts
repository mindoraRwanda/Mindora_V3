// Resolves a display name for a user ID by calling User Service's internal
// lookup through Kong (never User Service directly — same convention used
// elsewhere in this codebase). Falls back to the raw ID if the lookup fails,
// so a User Service hiccup degrades gracefully instead of breaking chat.
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  userName: string | null;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

async function fetchUserName(userId: string): Promise<string | null> {
  const base = process.env.KONG_URL ?? 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/internal/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string; userName: string | null };
    return data.userName ?? null;
  } catch (err) {
    console.error(`[resolve-username] Lookup failed for ${userId}:`, err);
    return null;
  }
}

export async function resolveUserName(userId: string): Promise<string | null> {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.userName;
  }
  const userName = await fetchUserName(userId);
  cache.set(userId, { userName, cachedAt: Date.now() });
  return userName;
}

export async function resolveUserNames(
  userIds: string[]
): Promise<Map<string, string | null>> {
  const unique = [...new Set(userIds)];
  const results = await Promise.all(
    unique.map(async (id) => [id, await resolveUserName(id)] as const)
  );
  return new Map(results);
}
