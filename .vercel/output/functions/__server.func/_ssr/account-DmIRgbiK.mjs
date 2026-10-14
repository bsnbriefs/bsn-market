import { r as createServerFn } from "./ssr.mjs";
import { c as createSsrRpc } from "./router-3DsyBKek.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account-DmIRgbiK.js
var getMe = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("a2bbbde0b1abf896e5be87d4046a6d2a567c76531893a88be1793127fbe8ad86"));
var updateProfile = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("8d530d1c9c020721e3070a8396f5f9aae65e30c4276218a2e5be20e14e7791e2"));
var saveAddress = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("6b6ca43c12404694a0fb11cb71f4d774c8c49e39f1c48d9324e5788e0c04cc8c"));
var deleteAddress = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((id) => typeof id === "string" ? id : "").handler(createSsrRpc("c271358b8eb58b54dd712ace16dcdabfe1980fae92b3a68d11873d0e2cf5925a"));
var claimMarketplace = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).handler(createSsrRpc("28709b93062905e1de40f5251b8bbd0641301ac57944f93d2ac75e8f1f66c246"));
var applyRetailer = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("249d0cddf6ddf8db48e4e297735b6390cb3825f6c6c25ae822068c742c155b57"));
var createTicket = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("29410b0313c8b606685074422a305b46455788b6cd12f820405a921679df41d4"));
var listMyTickets = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("ddf78ab9252d2119a448e98cc9c1bc11a5d8faa06398e6b7b6005e1bd3aa044b"));
var createProductRequest = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("6c58a123b44c351f6f0dd54fed02677b5321e7c890cb3a75fe4a021220f9a6d4"));
var listMyRequests = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("d6686ad33e214dbc6cf5892cd4599cd74bacfa0a0088ea0e325b46ab324edc30"));
var markNotificationsRead = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).handler(createSsrRpc("b987dd5073e639419ce13ba7c751e023d4ba7389a17b0bf19a6c90b70bcd5f9d"));
var createReview = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("a4e1b136f17084897adb5349fbf29dd3dd802331331551bdc5bd66c5569f4198"));
//#endregion
export { createTicket as a, listMyRequests as c, saveAddress as d, updateProfile as f, createReview as i, listMyTickets as l, claimMarketplace as n, deleteAddress as o, createProductRequest as r, getMe as s, applyRetailer as t, markNotificationsRead as u };
