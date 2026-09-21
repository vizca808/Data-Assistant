import { SmartReport } from "@/components/session/SmartReport";

export default async function SessionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const sessionId = params.id;

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden">
      <SmartReport sessionId={sessionId} />
    </div>
  );
}
