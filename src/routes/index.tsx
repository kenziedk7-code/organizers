import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { analyzeSpace, type SpaceAnalysis } from "../lib/analyze";
import { trackScanInitiated, trackOutboundClick } from "../lib/pixels";
import { saveScan, getSessionConsumer, consumerLogout } from "../lib/consumer-db";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SpaceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Consumer auth state
  const [consumerEmail, setConsumerEmail] = useState<string | null>(null);
  const [consumerToken, setConsumerToken] = useState<string | null>(null);
  const [scanSaved, setScanSaved] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem("consumer_token");
    if (!token) return;

    let cancelled = false;
    getSessionConsumer({ data: { token } })
      .then((c) => {
        if (!cancelled) {
          setConsumerToken(token);
          setConsumerEmail(c.email);
          localStorage.setItem("consumer", JSON.stringify(c));
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("consumer_token");
          localStorage.removeItem("consumer");
        }
      });

    return () => { cancelled = true; };
  }, []);

  const handleLogout = useCallback(async () => {
    if (consumerToken) {
      try { await consumerLogout({ data: { token: consumerToken } }); } catch {}
    }
    localStorage.removeItem("consumer_token");
    localStorage.removeItem("consumer");
    setConsumerToken(null);
    setConsumerEmail(null);
  }, [consumerToken]);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPEG, PNG, WebP, etc.)");
      return;
    }
    setError(null);
    setResult(null);
    setScanSaved(false);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    trackScanInitiated();
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setScanSaved(false);

    try {
      const analysis = await analyzeSpace({
        data: {
          imageBase64: image,
          mimeType,
        },
      });
      setResult(analysis);

      // Auto-save scan for logged-in users
      if (consumerToken) {
        try {
          await saveScan({
            data: {
              token: consumerToken,
              spaceType: analysis.spaceType,
              imageData: image,
              analysis,
            },
          });
          setScanSaved(true);
        } catch (err) {
          console.error("Failed to save scan:", err);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }, [image, mimeType, consumerToken]);

  const handleReset = useCallback(() => {
    setImage(null);
    setResult(null);
    setError(null);
    setScanSaved(false);
  }, []);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-indigo-50 to-white">
      {/* ── Header ── */}
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">ScanSort</span>
          </div>
          <div className="flex items-center gap-4">
            {consumerEmail ? (
              <>
                <a href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Dashboard
                </a>
                <span className="text-sm text-gray-500 hidden sm:inline">{consumerEmail}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Log In
                </a>
                <a href="/signup" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Sign Up
                </a>
                <a href="/partner" className="text-sm text-gray-500 hover:text-gray-700">
                  Partner Portal
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 pb-16 pt-8">
        {/* ── Hero ── */}
        {!image && !result && (
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Scan your space,{" "}
              <span className="text-indigo-600">get organized</span>
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              Snap a photo of any cluttered space — closet, pantry, garage — and
              we'll recommend the perfect storage products.
            </p>
          </div>
        )}

        {/* ── Upload area ── */}
        {!image && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
              dragOver
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <svg
                className="h-8 w-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700">
              Drop your photo here, or click to browse
            </p>
            <p className="mt-1 text-sm text-gray-500">
              JPEG, PNG, WebP — any size works
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* ── Image preview + Analyze button ── */}
        {image && !result && (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <img
                src={image}
                alt="Uploaded space"
                className="mx-auto max-h-96 w-full object-contain"
              />
            </div>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {analyzing ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                      />
                    </svg>
                    Analyze My Space
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={analyzing}
                className="text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-40"
              >
                Choose a different photo
              </button>
            </div>
          </div>
        )}

        {/* ── Loading spinner when analyzing with no preview shown ── */}
        {analyzing && !result && (
          <div className="mt-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="mt-4 text-gray-600">Analyzing your space with AI...</p>
            <p className="text-sm text-gray-400">This takes just a moment</p>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <div className="space-y-8">
            {/* Re-show image smaller */}
            {image && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <img
                  src={image}
                  alt="Uploaded space"
                  className="mx-auto max-h-64 w-full object-contain"
                />
              </div>
            )}

            {/* Saved confirmation for logged-in users */}
            {scanSaved && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Scan saved to your dashboard!
              </div>
            )}

            {/* Space Analysis Card */}
            <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  {result.spaceType}
                </span>
                <span className="text-xs text-gray-400">Space Analysis</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{result.observations}</p>

              {result.challenges.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Key Challenges
                  </h3>
                  <ul className="space-y-1">
                    {result.challenges.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Recommended Products ({result.recommendations.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.recommendations.map((rec, i) => {
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
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      {/* Product image (only when enriched) */}
                      {hasEnriched && rec.amazonProduct!.imageUrl && (
                        <div className="mb-3 overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={rec.amazonProduct!.imageUrl}
                            alt={displayTitle}
                            className="mx-auto h-40 w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {displayTitle}
                        </h3>
                        <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          #{i + 1}
                        </span>
                      </div>

                      {/* Price (only when enriched) */}
                      {hasEnriched && rec.amazonProduct!.price && (
                        <p className="mb-2 text-lg font-bold text-green-700">
                          {rec.amazonProduct!.price}
                        </p>
                      )}

                      <p className="mb-3 text-sm text-gray-600">{rec.description}</p>

                      <div className="mb-4 rounded-lg bg-indigo-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                          Why it fits
                        </p>
                        <p className="mt-1 text-sm text-indigo-900">{rec.whyItFits}</p>
                      </div>

                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackOutboundClick(displayTitle, linkUrl)}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                          />
                        </svg>
                        {hasEnriched ? "Buy on Amazon" : "View on Amazon"}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Partner Picks — only shown when matches exist */}
            {result.partnerPicks && result.partnerPicks.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    Partner Picks
                  </h2>
                  <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Partner Pick
                  </span>
                </div>
                <p className="mb-4 text-sm text-gray-500">
                  Products from our retail partners that match your space.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.partnerPicks.map((pick) => (
                    <div
                      key={pick.id}
                      className="flex flex-col rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {pick.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            pick.paymentStatus === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {pick.paymentStatus === "paid" ? "Verified" : "Pending"}
                        </span>
                      </div>

                      <p className="mb-3 text-sm text-gray-600">
                        {pick.description}
                      </p>

                      <div className="mb-4 rounded-lg bg-amber-100/60 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                          Why it fits
                        </p>
                        <p className="mt-1 text-sm text-amber-900">
                          {pick.whyItFits}
                        </p>
                      </div>

                      {/* Partner attribution */}
                      <p className="mb-3 text-xs text-gray-400">
                        Listed by{" "}
                        <span className="font-medium text-gray-500">
                          {pick.businessName}
                        </span>
                      </p>

                      <a
                        href={pick.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackOutboundClick(pick.name, pick.purchaseUrl)}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                          />
                        </svg>
                        View Product
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signup prompt — only for anonymous users */}
            {!consumerEmail && (
              <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Want to save your results?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create a free account to save your scans and get more personalized recommendations.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <a
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
                  >
                    Create Free Account
                  </a>
                  <a
                    href="/login"
                    className="text-sm font-medium text-indigo-600 underline hover:text-indigo-800"
                  >
                    Log in instead
                  </a>
                </div>
              </div>
            )}

            {/* Scan another */}
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm font-medium text-indigo-600 underline hover:text-indigo-800"
              >
                Scan another space
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        ScanSort &mdash; AI-powered organization recommendations
      </footer>
    </main>
  );
}
