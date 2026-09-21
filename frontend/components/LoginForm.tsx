// file: components/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Email atau password salah.");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="glass-card gradient-border p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && (
          <div className="bg-red-100 border border-red-300 rounded-md p-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <button className="btn-primary flex justify-center items-center" type="submit" disabled={loading}>
          {loading ? <span className="spinner w-4 h-4 mr-2" /> : null}
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
      <p className="text-center mt-6 text-sm text-gray-500">
        Belum punya akun?{' '}
        <Link href="/register" className="text-primary font-medium no-underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
