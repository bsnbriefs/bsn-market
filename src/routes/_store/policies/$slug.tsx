import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPolicy } from "@/lib/market/catalog";

export const Route = createFileRoute("/_store/policies/$slug")({
  loader: ({ params }) => getPolicy({ data: params.slug }),
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Policy"} · SEEK` },
      { name: "description", content: loaderData?.body.slice(0, 150) ?? "Marketplace policy" },
    ],
  }),
  component: PolicyPage,
});

function PolicyPage() {
  const policy = Route.useLoaderData();
  if (!policy) throw notFound();
  return (
    <article className="max-w-2xl">
      <h1 className="font-display text-4xl">{policy.title}</h1>
      <div className="mt-4 space-y-3 text-sm leading-6">
        {policy.body.split("\n").filter((line) => line.trim()).map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </article>
  );
}
