import type { ReactNode } from "react";

import { cn } from "@workspace/ui/lib/utils";

/** Phone-width column that fills the viewport; on larger screens it stays centered. */
export function AppScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-svh w-full max-w-md flex-col bg-background text-foreground",
        className,
      )}
    >
      {children}
    </main>
  );
}
