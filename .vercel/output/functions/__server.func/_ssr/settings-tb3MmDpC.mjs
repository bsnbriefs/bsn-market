import { o as formatNaira } from "./money-eRJ-C_HK.mjs";
import { i as require_jsx_runtime, r as useQueryClient, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { c as errText, r as Field, s as TextArea, t as Button } from "./ui-BLoIMfat.mjs";
import { t as NIGERIAN_STATES } from "./states-DaUIGTcT.mjs";
import { h as adminSaveSettings, r as adminGetSettings } from "./admin-BdpEpKZo.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-tb3MmDpC.js
var import_jsx_runtime = require_jsx_runtime();
function SettingsPage() {
	const settings = useQuery({
		queryKey: ["settings"],
		queryFn: () => adminGetSettings()
	});
	const queryClient = useQueryClient();
	const current = settings.data?.settings;
	async function onSubmit(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		try {
			await adminSaveSettings({ data: Object.fromEntries(form.entries()) });
			toast.success("Settings saved");
			await queryClient.invalidateQueries({ queryKey: ["settings"] });
		} catch (error) {
			toast.error(errText(error));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit,
		className: "max-w-2xl space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Site settings"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "storeName",
				defaultValue: current?.store_name ?? "",
				placeholder: "Store name",
				"aria-label": "Store name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "tagline",
				defaultValue: current?.tagline ?? "",
				placeholder: "Tagline",
				"aria-label": "Tagline"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "supportEmail",
				defaultValue: current?.support_email ?? "",
				placeholder: "Support email",
				"aria-label": "Support email"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "supportPhone",
				defaultValue: current?.support_phone ?? "",
				placeholder: "Support phone",
				"aria-label": "Support phone"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "contactAddress",
				defaultValue: current?.contact_address ?? "",
				placeholder: "Contact address",
				"aria-label": "Contact address"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Policy text"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				name: "policySlug",
				"aria-label": "Policy",
				className: "h-11 w-full rounded-xl border border-border bg-surface px-3",
				children: (settings.data?.policies ?? []).map((policy) => {
					const row = policy;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: row.slug,
						children: row.title
					}, row.slug);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "policyTitle",
				placeholder: "Policy title to save",
				"aria-label": "Policy title"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextArea, {
				name: "policyBody",
				placeholder: "Paste the full policy to replace the selected one",
				"aria-label": "Policy body"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Delivery fee"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Only states you configure can be paid immediately. Others become quote requests. Current: ", (settings.data?.zones ?? []).map((zone) => {
					const row = zone;
					return `${row.state}${row.city ? ` ${row.city}` : ""} ${formatNaira(Number(row.fee_kobo))}`;
				}).join(" · ")]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				name: "zoneState",
				"aria-label": "State fee",
				className: "h-11 w-full rounded-xl border border-border bg-surface px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					children: "State"
				}), NIGERIAN_STATES.map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: state }, state))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "zoneCity",
				placeholder: "City, or leave blank for the whole state",
				"aria-label": "City fee"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "zoneFee",
				placeholder: "Fee in naira",
				"aria-label": "Fee"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "Category and banner"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "categoryName",
				placeholder: "New category name",
				"aria-label": "Category"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "campaignTitle",
				placeholder: "Banner title",
				"aria-label": "Banner title"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "campaignSubtitle",
				placeholder: "Banner subtitle",
				"aria-label": "Banner subtitle"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				name: "campaignLink",
				placeholder: "/shop",
				"aria-label": "Banner link"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				children: "Save settings"
			})
		]
	});
}
//#endregion
export { SettingsPage as component };
