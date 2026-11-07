import { authClient } from "@/lib/auth-client";

export async function signOut(): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) throw new Error("Sign-out failed");
}
