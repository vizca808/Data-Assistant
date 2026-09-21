"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export function NewSessionButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const token = (session as any)?.accessToken;
      if (!token) return;
      const newSession: any = await api.sessions.create(token, `New Session ${new Date().toLocaleDateString()}`);
      router.push(`/session/${newSession.id}`);
    } catch (err) {
      console.error("Failed to create session", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="glass-card flex flex-col items-center justify-center p-8 gap-4 hover:border-accent-primary transition-all duration-200 group text-text-secondary hover:text-text-primary min-h-[200px]"
    >
      <div className="w-12 h-12 rounded-full bg-bg-input flex items-center justify-center group-hover:bg-accent-glow group-hover:text-accent-primary transition-colors">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
      </div>
      <span className="font-medium text-lg">Start New Session</span>
    </button>
  );
}
