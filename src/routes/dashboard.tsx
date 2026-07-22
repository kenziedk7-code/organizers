import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  getConsumerScans,
  consumerLogout,
  getSessionConsumer,
  type Consumer,
  type ScanRecord,
} from "../lib/consumer-db";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedScan, setExpandedScan] = useState<number | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("consumer_token") : null;

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const c = await getSessionConsumer({ data: { token: token! } });
        if (cancelled) return;
        setConsumer(c);

        const s = await getConsumerScans({ data: { token: token! } });
        if (cancelled) return;
        setScans(s);
      } catch {
        if (!cancelled) {
          localStorage.removeItem("consumer_token");
          localStorage.removeItem("consumer");
          navigate({ to: "/login" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, navigate]);

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await consumerLogout({ data: { token } });
      } catch { /* ignore */ }
    }
    localStorage.removeItem("consumer_token");
    localStorage.removeItem("consumer");
    navigate({ to: "/" });
  }, [token, navigate]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-indigo-50 to-white">
      {/* ── Header ── */}
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">ScanSort</span>
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{consumer?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pb-16 pt-8">
        {/* ── Welcome ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Dashboard</h1>
            <p className="mt-1 text-gray-600">
              {scans.length === 0
                ? "You haven't scanned any spaces yet. Let's fix that!"
                : `You have ${scans.length} saved scan${scans.length > 1 ? "s" : ""}.`}
            </p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Scan a New Space
          </a>
        </div>

        {/* ── Scans List ── */}
        {scans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">No scans yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Head to the home page, snap a photo, and your results will be saved here.
            </p>
            <a
              href="/"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 underline hover:text-indigo-800"
            >
              Go to scanner &rarr;
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Summary row */}
                <button
                  onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      {scan.spaceType}
                    </span>
                    <span className="text-sm text-gray-500">
                      {scan.recommendationCount} recommendation{scan.recommendationCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {new Date(scan.createdAt + "Z").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${expandedScan === scan.id ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded results */}
                {expandedScan === scan.id && (
                  <div className="border-t border-gray-100 px-6 pb-6 pt-4">
                    {/* Observations */}
                    <div className="mb-4 rounded-lg bg-indigo-50 p-4">
                      <p className="text-sm text-indigo-900">{scan.analysis.observations}</p>
                    </div>

                    {/* Challenges */}
                    {scan.analysis.challenges.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Challenges</h3>
                        <ul className="space-y-1">
                          {scan.analysis.challenges.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Recommendations ({scan.analysis.recommendations.length})
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {scan.analysis.recommendations.map((rec, i) => {
                          const hasEnriched = !!rec.amazonProduct;
                          const linkUrl = hasEnriched
                            ? rec.amazonProduct!.detailPageUrl
                            : rec.purchaseLink;
                          const displayTitle = hasEnriched
                            ? rec.amazonProduct!.title
                            : rec.name;

                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                            >
                              {hasEnriched && rec.amazonProduct!.imageUrl && (
                                <div className="mb-2 overflow-hidden rounded-lg bg-white">
                                  <img
                                    src={rec.amazonProduct!.imageUrl}
                                    alt={displayTitle}
                                    className="mx-auto h-32 w-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                                {displayTitle}
                              </h4>
                              {hasEnriched && rec.amazonProduct!.price && (
                                <p className="mt-1 text-sm font-bold text-green-700">
                                  {rec.amazonProduct!.price}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-gray-600">{rec.description}</p>
                              <div className="mt-2 rounded-lg bg-indigo-50 p-2">
                                <p className="text-xs text-indigo-700">{rec.whyItFits}</p>
                              </div>
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-all"
                              >
                                {hasEnriched ? "Buy on Amazon" : "View on Amazon"}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Partner Picks */}
                    {scan.analysis.partnerPicks && scan.analysis.partnerPicks.length > 0 && (
                      <div className="mt-4">
                        <div className="mb-3 flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">Partner Picks</h3>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Partner
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {scan.analysis.partnerPicks.map((pick) => (
                            <div
                              key={pick.id}
                              className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4"
                            >
                              <h4 className="font-semibold text-sm text-gray-900">{pick.name}</h4>
                              <p className="mt-1 text-xs text-gray-600">{pick.description}</p>
                              <div className="mt-2 rounded-lg bg-amber-100/60 p-2">
                                <p className="text-xs text-amber-700">{pick.whyItFits}</p>
                              </div>
                              <a
                                href={pick.purchaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-all"
                              >
                                View Product
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        ScanSort &mdash; AI-powered organization recommendations
      </footer>
    </main>
  );
}
