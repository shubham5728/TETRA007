import { Icon } from "./Icons";
import { Card } from "./ui";

/** Placeholder shown while a screen's data is in flight. */
export function Loading({ rows = 3 }) {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className="h-44 animate-pulse rounded-3xl bg-surface" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-3xl bg-surface"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Failure state. It names the actual problem rather than showing an empty
 * screen, because "the backend is not running" is the most common cause here.
 */
export function ErrorState({ error, onRetry }) {
  const offline = error?.status === 0;

  return (
    <Card>
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-risk-high/10 text-risk-high">
          <Icon name={offline ? "wifiOff" : "alert"} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-ink">
            {offline ? "Cannot reach the API" : "Something went wrong"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {error?.message ?? "Unknown error."}
          </p>
          {offline ? (
            <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-soft p-3 text-xs text-ink-soft">
              cd backend{"\n"}
              .venv\Scripts\activate{"\n"}
              uvicorn app.main:app --reload
            </pre>
          ) : null}
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-surface-soft hover:text-ink"
          >
            Try again
          </button>
        ) : null}
      </div>
    </Card>
  );
}
