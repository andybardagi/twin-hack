import { treaty, type Treaty } from "@elysia/eden";

import type { App } from "@/app/api/[[...slugs]]/route";

export const apiClient: Treaty.Create<App> = treaty<App>("", { keepDomain: true });
