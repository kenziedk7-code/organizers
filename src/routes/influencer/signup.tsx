import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { influencerSignup } from "../../lib/influencer-db";

export const Route = createFileRoute("/influencer/signup")({
  component: InfluencerSignup,
});

const BASE_URL = "https://ae3e9d780d0ee776bbb107eec25e3477.ctonew.app";

function InfluencerSignup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [platform, setPlatform] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    referralCode: string;
    referralLink: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await influencerSignup({
        data: {
          name,
          email,
          password,
          socialHandle: socialHandle || undefined,
          platform: platform || undefined,
        },
      });

      const code = res.influencer.referralCode;
      const link = `${BASE_URL}/partner/signup?ref=${code}`;

      // Store token in cookie
      document.cookie = `scanSortInfluencerToken=${res.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      setResult({ referralCode: code, referralLink: link });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  // ── Success state ──
  if (result) {
    return (
      <InfluencerLayout>
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-10 w-10 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
          <p className="mt-2 text-gray-600">
            Here's your unique referral link. Share it anywhere — every time a
            brand signs up through it, you earn a commission.
          </p>

          {/* Referral Link Card */}
          <div className="mt-6 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
            <p className="text-sm font-medium text-purple-600 mb-2">
              Your Referral Link
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.referralLink}
                className="flex-1 rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm text-gray-700 font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => copyToClipboard(result.referralLink)}
                className="shrink-0 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-700"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-purple-500">
              Your referral code: <strong>{result.referralCode}</strong>
            </p>
          </div>

          {/* Dashboard CTA */}
          <a
            href="/influencer/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-purple-700"
          >
            Go to Dashboard →
          </a>

          <p className="mt-4 text-xs text-gray-400">
            Bookmark your dashboard to track referrals and commissions anytime.
          </p>
        </div>
      </InfluencerLayout>
    );
  }

  // ── Signup form ──
  return (
    <InfluencerLayout>
      <div className="mx-auto max-w-md">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Join the ScanSort Influencer Program
        </h2>
        <p className="mb-8 text-gray-600">
          Earn 10% commission on every partner you refer. It's free to join.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Min. 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Social Handle{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={socialHandle}
              onChange={(e) => setSocialHandle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="@yourhandle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Platform{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
            >
              <option value="">Select platform...</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create Influencer Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/influencer/login"
            className="font-medium text-purple-600 hover:text-purple-700"
          >
            Log in
          </a>
        </p>
      </div>
    </InfluencerLayout>
  );
}

/** Shared layout wrapper for influencer pages */
export function InfluencerLayout({ children }: { children: React.ReactNode }) {
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
            <a href="/influencer" className="text-sm font-medium text-purple-600 hover:text-purple-700">
              Influencer Home
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
