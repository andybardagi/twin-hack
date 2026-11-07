"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";

import {
  DefaultReceiveTokenError,
  readDefaultReceiveToken,
  saveDefaultReceiveToken,
} from "@/components/settings/default-receive-token";
import { TokenPicker } from "@/components/tokens/token-picker";
import { findCollectableToken, tokens } from "@/src/helpers/tokens";

const collectableTokens = tokens.filter((token) => token.config.canCollect);
const queryKey = ["default-receive-token"];

export function DefaultReceiveTokenSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const saved = useQuery({ queryKey, queryFn: readDefaultReceiveToken });
  const mutation = useMutation({
    mutationFn: saveDefaultReceiveToken,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => {
      if (error instanceof DefaultReceiveTokenError && error.status === 401) {
        router.replace("/sign-in");
      }
    },
  });

  if (saved.isPending) return <p role="status">Loading default token…</p>;
  if (saved.isError)
    return (
      <div role="alert" className="space-y-2">
        <p>Couldn’t load the default token. Check your connection, then try again.</p>
        <Button onClick={() => void saved.refetch()}>Try again</Button>
      </div>
    );

  // Show the choice being saved right away; a failed save falls back to the stored token.
  const pendingAddress = mutation.isPending ? mutation.variables.defaultTokenAddress : null;
  const value = findCollectableToken(pendingAddress ?? saved.data ?? "");

  return (
    <div className="space-y-2" aria-busy={mutation.isPending}>
      <TokenPicker
        variant="field"
        title="Default token"
        description="Used for every new order unless you change it on the charge screen."
        tokens={collectableTokens}
        value={value}
        disabled={mutation.isPending}
        onChange={(token) => mutation.mutate({ defaultTokenAddress: token.address })}
      />
      <div role="status" aria-live="polite" className="text-sm">
        {mutation.isPending && <p className="text-muted-foreground">Saving…</p>}
        {mutation.isSuccess && <p className="text-muted-foreground">Default token saved.</p>}
      </div>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          Couldn’t save the default token. Check your connection, then try again.
        </p>
      )}
    </div>
  );
}
