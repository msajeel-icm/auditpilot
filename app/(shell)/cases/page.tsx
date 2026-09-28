import { CaseList } from "@/components/cases/CaseList";

export default function CasesPage() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-[13px] font-medium text-[hsl(var(--foreground))]">
          Cases
        </h2>
        <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
          Select a case to filter Documents and feed the Agents pipeline.
          Dense risk chips and mono IDs keep scan speed high.
        </p>
      </div>
      <CaseList />
    </div>
  );
}
