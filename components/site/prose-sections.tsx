import type { ReactNode } from "react";

export function ProseSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-body font-medium tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-body text-pretty text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:duration-300 [&_a]:ease-[var(--ease-swift)] [&_a]:hover:text-primary [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function ProseStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-10">{children}</div>;
}
