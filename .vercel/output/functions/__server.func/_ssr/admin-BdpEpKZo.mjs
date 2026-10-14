import { r as createServerFn } from "./ssr.mjs";
import { c as createSsrRpc } from "./router-3DsyBKek.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-BdpEpKZo.js
var getAdminOverview = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("0184ed58d7b7102737531c9f77f2de3fc6a1398de85c70704b6d264d6fe4305a"));
var adminListRetailers = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("ad4029746cf7170eba9da62ce834d131c592653daf1205bf6abb9922ca22b9b3"));
var adminSetRetailerStatus = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("e948c51f8bb0955f6a60a101675aff9582421bdf03e80d90d7372f10a2408ccb"));
var adminListProducts = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("25659dfbf1e3e40fffde7ff791453b83c1e0a8dc4a966f875e4317da18f69a85"));
var adminModerateProduct = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("5576a3df97bc3c945adfb2921dbdfa166718e6f72627e0219618d82833655e83"));
var adminListOrders = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("bc51345c9c0db2dded675934e01c81b5f0cdea916ea44ddfc8839693f7d6271c"));
var adminSetQuote = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("e797a2004fe671a5a87bfbc4d09d3ec3d476c4d08d81ad2ffa561178e51e9a6d"));
var adminRecordRefund = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("146481859b6e1eccced251b2365134f6f5bdb8520b5c01ff15f0e2bd6dcd0007"));
var adminFulfil = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("e099e9cd93fe835723a7a6a2c4acfdc90644c32251c1aa45150e2bf09aae9f5a"));
var adminListRules = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("86cd95e8fbe4c05aed157221719141567179b9988db420b8e2d3e953d4aa36bf"));
var adminSaveRule = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("2d57acaf6be0afebade1d2798f82cc8127655bfe5208a887018b08dab66745f7"));
var adminSavePromo = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("a20fb93e10ad031d0f0669391835caa5562509d5aaf0642c5e4de07369d59ff2"));
var adminListRequests = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("b6b354dcb1d92ab587ca1348299c3cde4f2df993b8c8165309fcbec0a90d4952"));
var adminUpdateRequest = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("db3d0aa189b911762b1a28879fe52daade2110e64d81e278c577ef41e2873cd1"));
var adminListTickets = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("85beddd9135937357e6031888c97e066348e838aaa0b27b96e1a23c6aacace1c"));
var adminReplyTicket = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("9d17c1395d95a1cf8c851ead81df46b7b56d5fffe07a4b62ec87ced7fd1f98b3"));
var adminGetSettings = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("d9859b9575f9011f37b49175aad781ed0bdf2eb834f44cd5d106a734f4a88d14"));
var adminSaveSettings = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("e3b9ba33e6b2dd1628a083b76ebccd644c6fbbf08314bb4d5e639ce39ea3dfb3"));
var adminCreateSettlement = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("f9664334f1f7e94a358281b5719a83e65e7cee48e583fa00055c248ff11de3da"));
//#endregion
export { adminSetRetailerStatus as _, adminListProducts as a, adminListRules as c, adminRecordRefund as d, adminReplyTicket as f, adminSetQuote as g, adminSaveSettings as h, adminListOrders as i, adminListTickets as l, adminSaveRule as m, adminFulfil as n, adminListRequests as o, adminSavePromo as p, adminGetSettings as r, adminListRetailers as s, adminCreateSettlement as t, adminModerateProduct as u, adminUpdateRequest as v, getAdminOverview as y };
