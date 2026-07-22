import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  getInfluencerDashboard,
  influencerLogout,
  getSessionInfluencer,
  type Influencer,
  type Referral,
} from "../../lib/influencer-db";
import { InfluencerLayout } from "./signup";

const BASE_URL = "https://ae3e9d780d0ee776bbb107eec25e3477.ctonew.app";

export const Route = createFileRoute("/influencer/dashboard")({
  component: InfluencerDashboard,
});

function InfluencerDashboard() {
  const navigate = useNavigate();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getToken = useCallback(() => {
    const match = document.cookie.match(
      /(?:^|;\s*)scanSortInfluencerToken=([^;]*)/
    );
    return match ? match[1] : null;
  }, []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate({ to: "/influencer/login" });
      return;
    }

    try {
      const data = await getInfluencerDashboard({ data: { token } });
      setInfluencer(data.influencer);
      setReferrals(data.referrals);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Invalid") || err.message.includes("expired"))
      ) {
        navigate({ to: "/influencer/login" });
      } else {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    const token = getToken();
    if (token) {
      try {
        await influencerLogout({ data: { token } });
      } catch {}
    }
    document.cookie =
      "scanSortInfluencerToken=; path=/; max-age=0; SameSite=Lax";
    navigate({ to: "/influencer/login" });
  };

  const handleCopyLink = async () => {
    if (!influencer) return;
    const link = `${BASE_URL}/partner/signup?ref=${influencer.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalCommissions = influencer
    ? (influencer.totalCommissionCents / 100).toFixed(2)
    : "0.00";
  const referralLink = influencer
    ? `${BASE_URL}/partner/signup?ref=${influencer.referralCode}`
    : "";

  if (loading) {
    return (
      <InfluencerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        </div>
      </InfluencerLayout>
    );
  }

  if (error) {
    return (
      <InfluencerLayout>
        <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </InfluencerLayout>
    );
  }

  return (
    <InfluencerLayout>
      {/* Welcome + logout */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome{influencer ? `, ${influencer.name}` : ""}
          </h2>
          <p className="text-sm text-gray-500">Influencer Dashboard</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>

      {/* Referral Link Card */}
      <div className="mb-8 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-purple-900">
          Your Referral Link
        </h3>
        <p className="mb-3 text-sm text-purple-700">
          Share this link with brands and content creators. When they sign up as
          ScanSort partners, you earn <strong>10% commission</strong> on their
          tier fee.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 rounded-lg border border-purple-300 bg-white px-3 py-2.5 text-sm text-gray-700 font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopyLink}
            className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all ${
              copied
                ? "bg-green-600"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
        <p className="mt-2 text-xs text-purple-500">
          Code: <strong>{influencer?.referralCode}</strong>
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Referrals"
          value={`${referrals.length}`}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Commissions"
          value={`$${totalCommissions}`}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accent="text-green-600"
        />
        <StatCard
          label="Paid Out"
          value="$0.00"
          sublabel="Coming soon"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
      </div>

      {/* Referrals Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Recent Referrals
        </h3>

        {referrals.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <svg
                className="h-6 w-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <p className="text-gray-500">No referrals yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Share your referral link to start earning commissions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 pr-4 font-medium text-gray-500">
                    Partner
                  </th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">
                    Tier
                  </th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">
                    Commission
                  </th>
                  <th className="pb-3 pr-4 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="pb-3 font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {r.partnerBusinessName}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 capitalize">
                        {r.partnerTier}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-green-600">
                      ${(r.commissionCents / 100).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.status === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(r.partnerSignupDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InfluencerLayout>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-purple-400">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}
