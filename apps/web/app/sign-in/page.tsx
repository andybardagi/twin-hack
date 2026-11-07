import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PonteLogo } from "@/components/brand/ponte-logo";
import { SignInProvider } from "@/components/auth/sign-in-provider";
import { getAuth } from "@/lib/auth";

export default async function SignInPage() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (session) redirect("/");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-8 py-16 text-foreground">
      <PonteLogo size={56} />
      <SignInProvider />
      <Link
        href="/how-it-works"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        How it works
      </Link>
    </main>
  );
}
