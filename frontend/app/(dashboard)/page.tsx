"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { SessionData } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function SessionCard({ session, onDelete }: { session: SessionData; onDelete: (id: string) => void }) {
  const router = useRouter();
  const fileTypeIcon: Record<string, string> = { csv: "📊", xlsx: "📗", xls: "📗", pdf: "📄", txt: "📝" };
  const icon = session.file ? (fileTypeIcon[session.file.file_type] || "📁") : "💬";

  return (
    <div
      className="glass-card"
      onClick={() => router.push(`/session/${session.id}`)}
      style={{
        padding: "1.25rem", cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex", flexDirection: "column", gap: "0.75rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--accent-primary)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-glow)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))",
            border: "1px solid rgba(99,102,241,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem",
            flexShrink: 0,
          }}>{icon}</div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</p>
            {session.file && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.file.row_count?.toLocaleString()} baris · {session.file.col_count} kolom
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "1rem", padding: "0.25rem",
            borderRadius: "4px", transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >🗑️</button>
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
        Diperbarui {formatDate(session.updated_at)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const token = (session as any)?.accessToken;

  useEffect(() => {
    if (!token) return;
    api.sessions.list(token).then((data: any) => {
      setSessions(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  const createSession = async () => {
    if (!token) return;
    setCreating(true);
    try {
      const newSession: any = await api.sessions.create(token, "Sesi Baru");
      router.push(`/session/${newSession.id}`);
    } finally {
      setCreating(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!token) return;
    await api.sessions.delete(token, id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div style={{
      maxWidth: "1100px", margin: "0 auto",
      padding: "2rem 1.5rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Selamat datang, <span className="gradient-text">{session?.user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem", fontSize: "0.9375rem" }}>
            Upload data dan mulai analisis dengan AI
          </p>
        </div>
        <button className="btn-primary" onClick={createSession} disabled={creating}>
          {creating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "＋"}
          Sesi Baru
        </button>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "var(--bg-card)", border: "2px dashed var(--border)",
          borderRadius: "16px",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h2 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Belum ada sesi analisis</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Mulai dengan membuat sesi baru dan upload file data Anda
          </p>
          <button className="btn-primary" onClick={createSession}>
            ＋ Buat Sesi Pertama
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}>
          {sessions.map((s) => (
            <div key={s.id} className="fade-in">
              <SessionCard session={s} onDelete={deleteSession} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
