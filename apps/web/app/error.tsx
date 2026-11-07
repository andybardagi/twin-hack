"use client";

import { Button } from "@workspace/ui/components/button";

export default function Error({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-8 py-16 text-foreground">
      <p role="alert">Couldn’t load this page. Check your connection and try again.</p>
      <Button onClick={() => unstable_retry()}>Try again</Button>
    </main>
  );
}
