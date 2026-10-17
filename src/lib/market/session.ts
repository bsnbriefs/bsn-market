import { createMiddleware } from "@tanstack/react-start";

export const sessionMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { UnauthorizedError, getSessionUser } = await import("@/lib/auth/verify.server");
    assertSameSiteRequest();
    const bearer = (context as { bearerToken?: string }).bearerToken;
    const user = await getSessionUser(bearer);
    if (!user) throw new UnauthorizedError();
    return next({ context: { userId: user.id, email: user.email ?? "" } });
  });

export const optionalSessionMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    assertSameSiteRequest();
    const bearer = (context as { bearerToken?: string }).bearerToken;
    const user = bearer ? await getSessionUser(bearer) : null;
    return next({ context: { userId: user?.id ?? "", email: user?.email ?? "" } });
  });

export type SessionContext = { userId: string; email: string };
