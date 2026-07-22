import { createFileRoute } from "@tanstack/react-router";
import { TIERS, type TierKey } from "../../lib/partner-db";

export const Route = createFileRoute("/partner/")({
  component: PartnerMarketing,
});

function PartnerMarketing() {
  const tiers = Object.entries(TIERS) as [TierKey, (typeof TIERS)[TierKey]][];

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
            <a
              href="/partner/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign In
            </a>
            <a
              href="/partner/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
            >
              Become a Partner
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Partner Program
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Your products, recommended by AI
          <br />
          <span className="text-indigo-600">
            at the exact moment someone needs them
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          ScanSort's AI analyzes photos of cluttered spaces and recommends the
          perfect organization products. List your products once, and our AI
          surfaces them to ready-to-buy customers — no ads, no guessing.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="/partner/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
          >
            Become a Partner
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <a
            href="#how-it-works"
            className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:bg-gray-50"
          >
            How It Works
          </a>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="mb-12 text-center text-gray-600">
            Three simple steps to reach customers when they're ready to buy
          </p>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "List Your Products",
                description:
                  "Add your organization and storage products to the ScanSort marketplace. Set descriptions, categories, and purchase links.",
                icon: (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "AI Recommends",
                description:
                  "When someone scans their space, our AI analyzes it and matches the best products — including yours — to their specific needs.",
                icon: (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "You Earn",
                description:
                  "Customers buy through your direct purchase links. You keep the sale, and we take a simple 5% commission on what sells.",
                icon: (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  {item.icon}
                </div>
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-500">
                  Step {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Simple, One-Time Pricing
          </h2>
          <p className="mb-12 text-center text-gray-600">
            Pay once. List forever. No recurring fees.
          </p>

          <div className="grid gap-6 sm:grid-cols-3">
            {tiers.map(([key, t]) => {
              const isPro = key === "pro";
              return (
                <div
                  key={key}
                  className={`relative rounded-2xl border-2 p-8 ${
                    isPro
                      ? "border-indigo-500 bg-white shadow-lg"
                      : "border-gray-200 bg-white shadow-sm"
                  }`}
                >
                  {isPro && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="mb-1 text-xl font-bold text-gray-900">
                    {t.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${t.price}
                    </span>
                    <span className="text-gray-500"> one-time</span>
                  </div>
                  <p className="mb-6 text-sm text-gray-600">
                    {t.maxListings === Infinity
                      ? "Unlimited product listings"
                      : `Up to ${t.maxListings} product listings`}
                  </p>
                  <ul className="mb-8 space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      AI-powered product matching
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Partner dashboard & analytics
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      5% commission on sales
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      No monthly fees, ever
                    </li>
                  </ul>
                  <a
                    href={`/partner/signup?tier=${key}`}
                    className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${
                      isPro
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Get Started
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Value Props */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Why Partners Love ScanSort
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              {
                title: "Intent-Driven Recommendations",
                description:
                  "Unlike banner ads or search, our AI recommends products based on what the customer's space actually needs — photos don't lie.",
              },
              {
                title: "No Ad Spend Required",
                description:
                  "Pay once to list, then earn on every sale. No CPC, no CPM, no budget management — just results.",
              },
              {
                title: "Built-In Trust",
                description:
                  "Products appear as smart, contextual suggestions — not ads. Customers see your product as the solution, not a sales pitch.",
              },
              {
                title: "Real-Time Dashboard",
                description:
                  "Track your listings, views, and sales from a clean partner dashboard. Know exactly how your products are performing.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-6"
              >
                <h3 className="mb-2 font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Ready to reach customers when they need you most?
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            Join ScanSort's partner program and put your products in front of
            purchase-ready customers.
          </p>
          <a
            href="/partner/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 text-lg font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
          >
            Become a Partner — Starting at $99
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
        <p>
          ScanSort &mdash; AI-powered organization recommendations
        </p>
        <p className="mt-1">
          <a href="/" className="text-indigo-500 hover:text-indigo-600">
            Back to ScanSort
          </a>
        </p>
      </footer>
    </div>
  );
}
