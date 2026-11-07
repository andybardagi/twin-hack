"use client";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";

import { signOut } from "@/components/auth/sign-out";

function SignOutButton() {
  const mutation = useMutation({
    mutationFn: signOut,
    retry: false,
    onSuccess: () => window.location.replace("/sign-in"),
  });

  return (
    <div className="space-y-2" aria-busy={mutation.isPending}>
      <Button disabled={mutation.isPending || mutation.isSuccess} onClick={() => mutation.mutate()}>
        {mutation.isPending || mutation.isSuccess ? "Signing out…" : "Sign out"}
      </Button>
      {mutation.isError && (
        <p role="alert" className="text-sm text-muted-foreground">
          Couldn’t sign out. Check your connection and try again.
        </p>
      )}
    </div>
  );
}

export { SignOutButton };
