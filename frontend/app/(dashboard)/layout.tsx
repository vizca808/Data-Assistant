"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <nav style={{
        height: "56px",
        background: "rgba(17, 17, 19, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem",
          }}>🧠</div>
          <span style={{ fontWeight: 700, fontSize: "1rem" }}>
            Data<span className="gradient-text">Mind AI</span>
          </span>
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

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
