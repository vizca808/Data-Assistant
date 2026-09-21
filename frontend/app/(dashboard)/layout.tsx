"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { SessionData } from "@/lib/types";
import { Plus, MessageSquare, Trash2, ChevronRight, BarChart2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [creating, setCreating] = useState(false);

  const token = (session as any)?.accessToken;

  // Fetch list sesi chat untuk ditampilkan di sidebar
  const loadSessions = () => {
    if (!token) return;
    api.sessions.list(token)
      .then((data: any) => {
        if (Array.isArray(data)) setSessions(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    loadSessions();
  }, [token, pathname]);

  const handleCreateNewChat = async () => {
    if (!token || creating) return;
    setCreating(true);
    try {
      const newSession: any = await api.sessions.create(token, "Chat Baru");
      loadSessions();
      router.push(`/session/${newSession.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!token) return;
    await api.sessions.delete(token, id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (pathname.includes(id)) {
      router.push("/");
    }
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg-primary">
      {/* Top Navbar */}
      <nav style={{
        height: "56px",
        background: "rgba(17, 17, 19, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.25rem",
        position: "sticky", top: 0, zIndex: 50,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem",
            }}>🧠</div>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
              Data<span className="gradient-text">Mind AI</span>
            </span>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            👤 {session.user?.name}
          </div>
          <button
            className="btn-ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ padding: "0.375rem 0.875rem", fontSize: "0.8125rem" }}
          >
            Keluar
          </button>
        </div>
      </nav>

      {/* Main Body with Left Sidebar */}
      <div className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
        {/* Left Sidebar: Riwayat Chat */}
        <aside style={{
          width: "260px",
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: "100%",
        }}>
          {/* Action: Buat Chat Baru */}
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
            <button
              onClick={handleCreateNewChat}
              disabled={creating}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.625rem 1rem",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: creating ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                transition: "all 0.2s",
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              {creating ? "Membuat..." : "Chat / Sesi Baru"}
            </button>
          </div>

          {/* List Riwayat Chat Sebelumnya */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "0.75rem 0.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }} className="custom-scrollbar">
            <div style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
              padding: "0.25rem 0.5rem 0.5rem",
            }}>
              Riwayat Chat
            </div>

            {sessions.length === 0 ? (
              <div style={{
                padding: "1rem 0.75rem",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}>
                Belum ada riwayat chat.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = pathname.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/session/${s.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      color: isActive ? "#ffffff" : "var(--text-secondary)",
                      background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-zinc-800/60"
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
                      <MessageSquare style={{ width: 14, height: 14, flexShrink: 0, color: isActive ? "#818cf8" : "var(--text-muted)" }} />
                      <span style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: isActive ? 600 : 400,
                      }}>
                        {s.name || "Sesi Tanpa Nama"}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      title="Hapus riwayat chat"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      className="hover:text-red-400"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">{children}</main>
      </div>
    </div>
  );
}
