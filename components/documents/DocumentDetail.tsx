"use client";

import { useAppStore } from "@/lib/store";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export function DocumentDetail() {
  const documents = useAppStore((s) => s.documents);
  const selectedDocumentId = useAppStore((s) => s.selectedDocumentId);
  const cases = useAppStore((s) => s.cases);

  const doc = documents.find((d) => d.id === selectedDocumentId);
  const caseName = doc
    ? cases.find((c) => c.id === doc.caseId)?.name
    : undefined;

  if (!doc) {
    return (
      <div className="flex h-full min-h-[200px] items-center rounded-md border border-dashed border-[hsl(var(--border))] px-4 py-8">
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">
          Select a document to read the full body.
        </p>
      </div>
    );
  }

  return (
    <article className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <header className="shrink-0 border-b border-[hsl(var(--border))] px-3 py-2.5">
        <h3 className="text-[13px] font-medium text-[hsl(var(--foreground))]">
          {doc.title}
        </h3>
        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-[hsl(var(--muted-foreground))]">
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {doc.id}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {doc.docType}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px]">
            {formatDate(doc.updatedAt)}
          </span>
          {caseName ? <span>{caseName}</span> : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        <p className="mb-3 text-[12px] text-[hsl(var(--muted-foreground))]">
          {doc.excerpt}
        </p>
        <pre className="whitespace-pre-wrap font-[family-name:var(--font-mono)] text-[12px] leading-relaxed text-[hsl(var(--foreground))]">
          {doc.body}
        </pre>
      </div>
    </article>
  );
}
