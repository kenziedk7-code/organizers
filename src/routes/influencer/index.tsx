import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/influencer/")({
  component: InfluencerMarketing,
});

function InfluencerMarketing() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="border-b border-purple-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-sm font-bold text-white">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">ScanSort</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to ScanSort
            </a>
            <a
              href="/influencer/signup"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-700"
            >
              Join Now
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-8 w-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Earn 10% for every brand you bring to{" "}
            <span className="text-purple-600">ScanSort</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Share your unique referral link with brands and influencers. When they
            sign up as ScanSort partners, you earn a 10% commission on their
            onboarding fee — for life.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a
              href="/influencer/signup"
              className="rounded-xl bg-purple-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-purple-700"
            >
              Start Earning →
            </a>
            <a
              href="/influencer/login"
              className="text-sm font-medium text-purple-600 underline hover:text-purple-800"
            >
              Already an influencer? Log in
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Sign Up",
                desc: "Create your free influencer account in 30 seconds.",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                ),
              },
              {
                step: "2",
                title: "Get Your Link",
                desc: "We generate a unique referral link just for you.",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
              },
              {
                step: "3",
                title: "Share",
                desc: "Share it with brands, on social media, in your content.",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                ),
              },
              {
                step: "4",
                title: "Earn",
                desc: "Get 10% of every partner's tier fee — up to $69.90 per referral.",
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  {item.icon}
                </div>
                <div className="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                  Step {item.step}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="px-6 py-16 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
            What You Earn
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                tier: "Starter",
                partnerFee: "$99",
                commission: "$9.90",
                desc: "5 listings",
              },
              {
                tier: "Growth",
                partnerFee: "$299",
                commission: "$29.90",
                desc: "25 listings",
              },
              {
                tier: "Pro",
                partnerFee: "$699",
                commission: "$69.90",
                desc: "Unlimited listings",
              },
            ].map((t) => (
              <div
                key={t.tier}
                className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-6 text-center"
              >
                <h3 className="text-lg font-semibold text-gray-900">{t.tier}</h3>
                <p className="mt-1 text-sm text-gray-500">{t.desc}</p>
                <div className="mt-4 text-3xl font-bold text-purple-600">
                  {t.commission}
                </div>
                <p className="text-sm text-purple-500">
                  per referral
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Partner pays {t.partnerFee}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to start earning?
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Join ScanSort's influencer program today and turn your audience into
            income.
          </p>
          <a
            href="/influencer/signup"
            className="mt-8 inline-block rounded-xl bg-purple-600 px-10 py-4 text-lg font-semibold text-white shadow-sm transition-all hover:bg-purple-700"
          >
            Sign Up Free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        ScanSort &mdash; AI-powered organization recommendations
      </footer>
    </div>
  );
}
