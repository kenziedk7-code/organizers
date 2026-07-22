import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { consumerSignup } from "../lib/consumer-db";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (usePassword && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await consumerSignup({
        data: {
          email,
          password: usePassword ? password : undefined,
        },
      });

      // Store token in localStorage
      localStorage.setItem("consumer_token", result.token);
      localStorage.setItem("consumer", JSON.stringify(result.consumer));

      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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
            <a href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Log In
            </a>
            <a href="/partner" className="text-sm text-gray-500 hover:text-gray-700">
              Partner Portal
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-md px-6 pb-16 pt-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your free account</h1>
          <p className="mt-2 text-gray-600">
            Save your scan results and get personalized recommendations.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Signup method toggle */}
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setUsePassword(true)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                usePassword
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                !usePassword
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Email Only
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {usePassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required={usePassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Free Account"}
            </button>
          </form>

          {!usePassword && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              No password needed — we'll remember you with a secure session. You can add a password later.
            </p>
          )}

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              Log in
            </a>
          </p>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-400">
        ScanSort &mdash; AI-powered organization recommendations
      </footer>
    </main>
  );
}
