import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          ["User-agent: *", "Allow: /", "Disallow: /account", "Disallow: /checkout", "Disallow: /cart", "Disallow: /orders", "Disallow: /admin", "Disallow: /retailer", "Disallow: /login"].join("\n"),
          { headers: { "content-type": "text/plain" } },
        ),
    },
  },
});
