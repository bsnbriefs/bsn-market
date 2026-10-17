import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <main
      className={
        "flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6 py-16 text-center " +
        "bg-bg text-fg"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {errorMessage(error)}
      </p>
      <button type="button" onClick={() => reset()} className="seek-cta mt-2 h-11 rounded-full px-5 text-sm font-semibold text-white">
        Try again
      </button>
    </main>
  );
}
