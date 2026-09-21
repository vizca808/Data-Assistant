"use client";

import { SmartReport } from "@/components/session/SmartReport";
import N8nChatWidget from "@/components/N8nChatWidget";
import { useParams } from "next/navigation";

export default function SessionPage() {
  const params = useParams();
  const sessionId = params?.id as string;

  return (
    <div className="flex w-full h-[calc(100vh-56px)] overflow-hidden">
      {/* Area Laporan & Visualisasi (Sebelah Kiri) */}
      <div className="flex-1 h-full overflow-hidden">
        <SmartReport sessionId={sessionId} />
      </div>

      {/* Sidebar Panel Chatbot (Sebelah Kanan, Permanen/Dermaga) */}
      <div className="w-[420px] border-l border-zinc-800 bg-zinc-950 flex flex-col h-full shrink-0">
        <N8nChatWidget sessionId={sessionId} isSidebarMode={true} />
      </div>
    </div>
  );
}
