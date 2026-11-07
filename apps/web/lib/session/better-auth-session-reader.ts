import { getAuth } from "@/lib/auth";
import type { SessionReader } from "@/lib/session/session-reader";

export const betterAuthSessionReader: SessionReader = {
  async read(headers) {
    const session = await getAuth().api.getSession({ headers });
    return session ? { userId: session.user.id } : null;
  },
};
