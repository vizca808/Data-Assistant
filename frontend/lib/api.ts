const isServer = typeof window === 'undefined';
const BACKEND_URL = isServer ? (process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000") : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000");

async function fetchAPI<T = any>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      fetchAPI("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),
    me: (token: string) => fetchAPI("/api/auth/me", { token }),
  },

  // ─── Sessions ──────────────────────────────────────────────
  sessions: {
    list: (token: string) => fetchAPI("/api/sessions", { token }),
    create: (token: string, name: string) =>
      fetchAPI("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ name }),
        token,
      }),
    get: (token: string, id: string) => fetchAPI(`/api/sessions/${id}`, { token }),
    delete: (token: string, id: string) =>
      fetch(`${BACKEND_URL}/api/sessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
  },

  // ─── Upload ────────────────────────────────────────────────
  upload: {
    file: async (token: string, sessionId: string, file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || "Upload failed");
      }
      return res.json();
    },
  },

};
