import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { influencerLogin } from "../../lib/influencer-db";
import { InfluencerLayout } from "./signup";

export const Route = createFileRoute("/influencer/login")({
  component: InfluencerLogin,
});

function InfluencerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await influencerLogin({
        data: { email, password },
      });
      document.cookie = `scanSortInfluencerToken=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      navigate({ to: "/influencer/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InfluencerLayout>
      <div className="mx-auto max-w-md">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Influencer Login
        </h2>
        <p className="mb-8 text-gray-600">
          Sign in to your influencer dashboard.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          New influencer?{" "}
          <a
            href="/influencer/signup"
            className="font-medium text-purple-600 hover:text-purple-700"
          >
            Create an account
          </a>
        </p>
      </div>
    </InfluencerLayout>
  );
}
