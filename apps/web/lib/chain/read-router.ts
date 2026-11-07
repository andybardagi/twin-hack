import type { Router } from "@/lib/chain/router-reader";

export type RouterSource = () => Router;

/** Resolves to null when the chain can't answer, so callers can never treat that as a pass. */
export async function readRouter<T>(
  source: RouterSource,
  read: (router: Router) => Promise<T>,
): Promise<T | null> {
  const router = source();
  try {
    return await read(router);
  } catch (error) {
    console.error(error);
    return null;
  }
}
