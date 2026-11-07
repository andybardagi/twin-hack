import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignInProvider } from "@/components/auth/sign-in-provider";
import { getAuth } from "@/lib/auth";

export default async function SignInPage() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (session) redirect("/");

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-8 py-16 text-foreground">
      <SignInProvider />
    </main>
  );
}
