import { i as gateIdentityEnabled, n as auth, r as authConfigured } from "./server-DioXkgY1.mjs";
import { o as getRequest } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verify.server-D62WUETn.js
if (Boolean(process.env.DATABASE_URL?.trim()) && !authConfigured) console.error("[auth] DATABASE_URL is set but auth is disabled (VITE_AUTH_ENABLED=false) — requireUserId() will reject every request (fail closed) rather than share one dev user on a real database.");
/**
* Thrown by `requireUserId` when the caller has no valid session. Carries
* `status: 401`; the message is a stable contract — match
* `err.message === "Unauthorized"` client-side to send the visitor to sign-in.
*/
var UnauthorizedError = class extends Error {
	status = 401;
	constructor() {
		super("Unauthorized");
		this.name = "UnauthorizedError";
	}
};
/**
* Resolve the signed-in user from the current request, or `null` when auth isn't
* configured / nobody is signed in. Safe to call from server functions and SSR
* loaders.
*
* `bearerToken` is for the LIVE PREVIEW: the app runs in a partitioned iframe
* whose cookies don't reach the server, so `authMiddleware` forwards the session
* as a bearer token, which we present as `Authorization: Bearer …` (the `bearer`
* plugin resolves it). When deployed no token is passed and the cookie is used.
*/
async function getSessionUser(bearerToken) {
	if (!authConfigured && !gateIdentityEnabled()) return null;
	const request = getRequest();
	if (!request) return null;
	let headers = request.headers;
	if (bearerToken) {
		headers = new Headers(request.headers);
		headers.set("Authorization", `Bearer ${bearerToken}`);
	}
	const session = await auth.api.getSession({ headers });
	if (!session?.user) return null;
	return {
		id: session.user.id,
		email: session.user.email ?? null
	};
}
//#endregion
export { UnauthorizedError, getSessionUser };
