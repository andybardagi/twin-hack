import { assertNever } from "@workspace/payments/assert-never";

import type { RouterReaderResult } from "@/lib/chain/router-reader";

export type RouterSource = () => RouterReaderResult;

/** Resolves to null when the chain can't answer, so callers can never treat that as a pass. */
export async function readRouter<T>(
  source: RouterSource,
  read: (router: Extract<RouterReaderResult, { status: "configured" }>) => Promise<T>,
): Promise<T | null> {
  const router = source();
  switch (router.status) {
    case "not-configured":
      return null;
    case "configured":
      try {
        return await read(router);
      } catch (error) {
        console.error(error);
        return null;
      }
    default:
      return assertNever(router);
  }
}
