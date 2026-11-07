# 004 — EVM wallet login

## Status: done

Provide wallet login for `apps/web`: connect, sign, create a session, visit one protected page, and sign out.
Contract calls and wallet views are deferred to a later PR. Feature 003 remains pending; no Elysia is introduced.

## Decisions

- Postgres + Drizzle ORM, drizzle-kit migrations, and `pg`. Root Docker Compose uses generic local credentials.
- App-generated UUIDv7 IDs with no database default on ID columns.
- Better-auth SIWE with `anonymous: true`, no email collection or ENS, and the default session lifetime.
  The plugin's required user fields remain in the schema; there is no user-facing email flow.
- Better-auth mounts directly at `app/api/auth/[...all]/route.ts`. Auth and database setup are lazy so builds need no env.
- Arbitrum only (42161) in every sign-in message; no network switch for login. viem verifies regular wallets locally.
  Only regular wallets are supported; smart wallets such as Safe cannot sign in. Malformed and contract-style
  signatures return 401.
- wagmi 3 discovers EIP-6963 wallets. `/sign-in` shows one button per wallet, or a no-wallet install hint.
  No dialog, WalletConnect, RainbowKit, or ConnectKit.
- `/` checks the session server-side with next/headers and redirects to `/sign-in` when logged out. No proxy.
  A single bounded database query loads the primary wallet by session user ID, never client input.
- Home shows the wallet address in monospace and a sign-out button. TanStack Query handles sign-out pending/error
  states; returned better-auth errors fail the mutation. Successful sign out navigates to `/sign-in`.
- UI uses shared components and semantic tokens for both light and dark themes.

## Acceptance and verification

- Detected wallets can connect and sign an Arbitrum message, including from another active network. Cancellation
  and API failures support retry; no-wallet state explains how to install or enable a wallet.
- Successful login persists a session and primary wallet. Replay, wrong domain/chain, and invalid signatures fail.
- Logged-out home requests redirect. Signed-in home requests show only that session user's primary address.
- Sign out removes the session and returns to sign-in, with pending and actionable error states.
- Real Postgres integration tests cover authentication, sessions, sign out, primary address lookup, and isolation
  from another user's wallet. Client tests cover retries and sign-out API/network errors.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm build` without env, `pnpm test`, `pnpm knip`, and `pnpm format`.
- Not yet verified: login with a real browser wallet popup, and both themes visually.

Local environment and login instructions live in `docs/conventions.md`; auth layout lives in `docs/architecture.md`.
