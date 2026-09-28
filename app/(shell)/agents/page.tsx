import { AgentRunner } from "@/components/agents/AgentRunner";

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-[13px] font-medium text-[hsl(var(--foreground))]">
          Agents
        </h2>
        <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
          Progressive SSE stream of the Reader → Narrator audit pipeline for
          the selected case. Cancel or Esc aborts an in-flight run.
        </p>
      </div>
      <AgentRunner />
    </div>
  );
}
