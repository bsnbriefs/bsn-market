import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { listSitemapPaths } = await import("@/lib/market/sitemap.server");
        const origin = new URL(request.url).origin;
        const paths = await listSitemapPaths();
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
          .map((path) => `<url><loc>${origin}${path}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(body, { headers: { "content-type": "application/xml" } });
      },
    },
  },
});
