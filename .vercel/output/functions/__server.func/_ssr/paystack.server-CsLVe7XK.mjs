//#region node_modules/.nitro/vite/services/ssr/assets/paystack.server-CsLVe7XK.js
async function verifyPaystack(reference) {
	const secret = process.env.PAYSTACK_SECRET_KEY;
	if (!secret) return null;
	const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
	const body = await response.json();
	if (!response.ok || !body.status || !body.data) return null;
	return body.data;
}
//#endregion
export { verifyPaystack };
