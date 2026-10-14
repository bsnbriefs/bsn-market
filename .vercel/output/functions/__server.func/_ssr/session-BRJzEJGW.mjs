import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/session-BRJzEJGW.js
var sessionMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-IWHfIGH2.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { UnauthorizedError, getSessionUser } = await import("./verify.server-D62WUETn.mjs");
	assertSameSiteRequest();
	const bearer = context.bearerToken;
	const user = await getSessionUser(bearer);
	if (!user) throw new UnauthorizedError();
	return next({ context: {
		userId: user.id,
		email: user.email ?? ""
	} });
});
//#endregion
export { sessionMiddleware as t };
