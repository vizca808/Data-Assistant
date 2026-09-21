"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      await api.auth.register(name, email, password);
      // Auto-login after register
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Registrasi berhasil, silakan login.");
        router.push("/login");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.1) 0%, var(--bg-primary) 60%)",
      padding: "2rem",
    }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "48px 48px", pointerEvents: "none",
      }} />

      <div className="fade-in" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem", fontSize: "1.5rem",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
          }}>🧠</div>
          <h1 className="gradient-text" style={{ fontSize: "1.5rem", fontWeight: 700 }}>DataMind AI</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Buat akun baru
          </p>
        </div>

        <div className="glass-card gradient-border" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Nama Lengkap
              </label>
              <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Email
              </label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Password
              </label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 karakter" required />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "8px", padding: "0.75rem", fontSize: "0.875rem", color: "#ef4444",
              }}>{error}</div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center", padding: "0.75rem" }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Sudah punya akun?{" "}
            <Link href="/login" style={{ color: "var(--accent-primary)", fontWeight: 500, textDecoration: "none" }}>
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
