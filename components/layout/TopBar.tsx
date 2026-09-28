type TopBarProps = {
  title: string;
};

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="flex h-11 shrink-0 items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4">
      <h1 className="text-[13px] font-medium tracking-tight text-[hsl(var(--foreground))]">
        {title}
      </h1>
    </header>
  );
}
