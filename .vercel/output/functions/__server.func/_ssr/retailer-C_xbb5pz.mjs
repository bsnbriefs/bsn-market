import { r as createServerFn } from "./ssr.mjs";
import { c as createSsrRpc } from "./router-3DsyBKek.mjs";
import { t as sessionMiddleware } from "./session-BRJzEJGW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/retailer-C_xbb5pz.js
var getRetailerDashboard = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("1318d8ef5632b6309cf4a4913ef934ce71ec844b25d17f63f4b7dbe3095d1f04"));
var listMyProducts = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("aad6a88b7f6d4010e07c5f41a0fefb268c5086ed385da70de8711656e1200d54"));
var saveMyProduct = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("d8b40029063f7a90aaaa57d914b20611c3fdaeadface2a6db9c0bd10467f6d18"));
var archiveMyProduct = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((id) => typeof id === "string" ? id : "").handler(createSsrRpc("fa896dbec0c450335eae2e9808abc67c62372caaec8d9a97b97f40783f947095"));
var listRetailerOrders = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("d0609ab71bcd81aee66fd9c8f1d0374c8a9cb69e51dad08027da1bb5ae8aeaa9"));
var updateMyFulfilment = createServerFn({ method: "POST" }).middleware([sessionMiddleware]).validator((input) => input).handler(createSsrRpc("01d6214eca2f4654860eff1b069f191bed2e2143ff1e40b6449b3629a7bc849d"));
var getEarnings = createServerFn({ method: "GET" }).middleware([sessionMiddleware]).handler(createSsrRpc("aebfbf6be58e57d495cbb3b5d25708fe70801686d94e2dc246896d40fd7faab0"));
//#endregion
export { listRetailerOrders as a, listMyProducts as i, getEarnings as n, saveMyProduct as o, getRetailerDashboard as r, updateMyFulfilment as s, archiveMyProduct as t };
