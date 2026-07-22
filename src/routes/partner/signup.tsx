import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { partnerSignup, STRIPE_PAYMENT_LINKS, TIERS, type TierKey } from "../../lib/partner-db";

export const Route = createFileRoute("/partner/signup")({
  component: PartnerSignup,
});

function PartnerSignup() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tier, setTier] = useState<TierKey>("starter");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    businessName: string;
    tier: TierKey;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await partnerSignup({
        data: { businessName, email, password, tier },
      });
      setConfirmData({ businessName: result.businessName, tier: result.tier });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Interstitial: show before redirecting to Stripe ──
  if (confirmData) {
    const tierName = TIERS[confirmData.tier].name;
    const tierPrice = TIERS[confirmData.tier].price;
    const stripeUrl = STRIPE_PAYMENT_LINKS[confirmData.tier];
    const fullStripeUrl = new URL(stripeUrl);
    fullStripeUrl.searchParams.set("prefilled_email", email);

    return (
      <PartnerLayout>
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-10 w-10 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            Account created!
          </h2>
          <p className="mt-2 text-gray-600">
            You'll be redirected to Stripe to complete your payment.
          </p>

          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="h-5 w-5 text-indigo-600 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="font-semibold text-indigo-800">What happens next</h3>
            </div>
            <ul className="space-y-2 text-sm text-indigo-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">1.</span>
                <span>
                  Complete the <strong>{tierName}</strong> payment (${tierPrice}{" "}
                  one-time) on Stripe's secure checkout page.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">2.</span>
                <span>
                  After payment, your account will activate automatically via
                  Stripe's webhook. This may take a few moments.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">3.</span>
                <span>
                  Once activated, log in and start listing your products.
                </span>
              </li>
            </ul>
          </div>

          <a
            href={fullStripeUrl.toString()}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
          >
            Continue to Stripe →
          </a>

          <p className="mt-4 text-xs text-gray-400">
            You'll be redirected to Stripe's secure payment page. If you're not
            redirected automatically within a few seconds, click the button
            above.
          </p>
        </div>
      </PartnerLayout>
    );
  }

  // ── Signup form ──
  return (
    <PartnerLayout>
      <div className="mx-auto max-w-md">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Become a ScanSort Partner
        </h2>
        <p className="mb-8 text-gray-600">
          List your organizational products and reach customers at the exact
          moment they need them.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Your brand or store name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Tier
            </label>
            <div className="space-y-3">
              {(
                Object.entries(TIERS) as [TierKey, (typeof TIERS)[TierKey]][]
              ).map(([key, t]) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                    tier === key
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={key}
                    checked={tier === key}
                    onChange={() => setTier(key)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-semibold text-gray-900">
                        {t.name}
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        ${t.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {t.maxListings === Infinity
                        ? "Unlimited listings"
                        : `Up to ${t.maxListings} listings`}
                      {" — one-time fee"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Partner Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/partner/login"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Log in
          </a>
        </p>
      </div>
    </PartnerLayout>
  );
}

/** Shared layout wrapper for partner pages */
export function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="border-b border-indigo-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">ScanSort</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to ScanSort
            </a>
            <a href="/partner" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Partner Home
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        ScanSort &mdash; AI-powered organization recommendations
      </footer>
    </div>
  );
}
