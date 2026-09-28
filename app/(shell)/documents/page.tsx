"use client";

import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentDetail } from "@/components/documents/DocumentDetail";
import { useAppStore } from "@/lib/store";

export default function DocumentsPage() {
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const cases = useAppStore((s) => s.cases);
  const selectCase = useAppStore((s) => s.selectCase);
  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[13px] font-medium text-[hsl(var(--foreground))]">
            Documents
          </h2>
          <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">
            {selectedCase
              ? `Filtered to ${selectedCase.name}`
              : "No case selected — pick one on Cases, or clear to browse all."}
          </p>
        </div>
        {selectedCaseId ? (
          <button
            type="button"
            onClick={() => selectCase(null)}
            className="rounded-md border border-[hsl(var(--border))] px-2 py-1 text-[11px] text-[hsl(var(--muted-foreground))] outline-none hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Clear case filter
          </button>
        ) : null}
      </div>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <DocumentList />
        <DocumentDetail />
      </div>
    </div>
  );
}
