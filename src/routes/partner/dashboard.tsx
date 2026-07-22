import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  getPartnerStats,
  getListings,
  partnerLogout,
  getSessionPartner,
  STRIPE_PAYMENT_LINKS,
  TIERS,
  type Partner,
  type ProductListing,
} from "../../lib/partner-db";
import { PartnerLayout } from "./signup";

export const Route = createFileRoute("/partner/dashboard")({
  component: PartnerDashboard,
});

function PartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState<{
    tier: string;
    tierName: string;
    listingCount: number;
    maxListings: number | string;
    totalSales: number;
  } | null>(null);
  const [recentListings, setRecentListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(() => {
    const match = document.cookie.match(/(?:^|;\s*)scanSortToken=([^;]*)/);
    return match ? match[1] : null;
  }, []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate({ to: "/partner/login" });
      return;
    }

    try {
      const [partnerData, statsData, listingsData] = await Promise.all([
        getSessionPartner({ data: { token } }),
        getPartnerStats({ data: { token } }),
        getListings({ data: { token } }),
      ]);
      setPartner(partnerData);
      setStats(statsData);
      setRecentListings(listingsData.slice(0, 5));
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("Invalid") || err.message.includes("expired"))
      ) {
        navigate({ to: "/partner/login" });
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
        await partnerLogout({ data: { token } });
      } catch {}
    }
    document.cookie =
      "scanSortToken=; path=/; max-age=0; SameSite=Lax";
    navigate({ to: "/partner/login" });
  };

  if (loading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </PartnerLayout>
    );
  }

  if (error) {
    return (
      <PartnerLayout>
        <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </PartnerLayout>
    );
  }

  const tierInfo = stats ? TIERS[stats.tier as keyof typeof TIERS] : null;
  const isPaid = partner?.paymentStatus === "paid";
  const hasListings = (stats?.listingCount ?? 0) > 0;

  return (
    <PartnerLayout>
      {/* Welcome + logout */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome{partner ? `, ${partner.businessName}` : ""}
          </h2>
          <p className="text-sm text-gray-500">Partner Dashboard</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
        >
          Sign Out
        </button>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Listings Live"
          value={`${stats?.listingCount ?? 0}`}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          sublabel={`of ${stats?.maxListings ?? "—"}`}
        />
        <StatCard
          label="Current Tier"
          value={stats?.tierName || "—"}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
          accent={isPaid ? "text-green-600" : "text-amber-600"}
        />
        <StatCard
          label="Product Views"
          value="—"
          sublabel="Coming soon"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <StatCard
          label="Sales"
          value="—"
          sublabel="Coming soon"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Getting Started Checklist */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Getting Started
            </h3>
            <ul className="space-y-3">
              <ChecklistItem
                done={true}
                label="Account created"
                detail={partner ? new Date(partner.createdAt).toLocaleDateString() : ""}
              />
              <ChecklistItem
                done={isPaid}
                label="Complete payment"
                detail={
                  isPaid
                    ? "Paid ✓"
                    : partner?.tier && STRIPE_PAYMENT_LINKS[partner.tier]
                      ? "Pending"
                      : ""
                }
                action={
                  !isPaid && partner?.tier && STRIPE_PAYMENT_LINKS[partner.tier]
                    ? {
                        label: "Pay now →",
                        href: `${STRIPE_PAYMENT_LINKS[partner.tier]}?prefilled_email=${encodeURIComponent(partner.email)}`,
                      }
                    : undefined
                }
              />
              <ChecklistItem
                done={hasListings}
                label="Add your first listing"
                detail={hasListings ? `${stats?.listingCount} added` : ""}
                action={
                  !hasListings
                    ? {
                        label: "Add listing →",
                        onClick: () => navigate({ to: "/partner/listings" }),
                      }
                    : undefined
                }
              />
              <ChecklistItem
                done={isPaid && hasListings}
                label="Start earning commissions"
                detail={
                  isPaid && hasListings
                    ? "Products are live!"
                    : !isPaid
                      ? "Complete payment first"
                      : "Add listings first"
                }
              />
            </ul>
          </div>

          {/* Payment pending banner */}
          {partner?.paymentStatus === "pending" && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-amber-800">
                    Payment pending
                  </h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Complete your one-time payment to activate your account and
                    start earning.
                  </p>
                  {partner.tier && STRIPE_PAYMENT_LINKS[partner.tier] && (
                    <a
                      href={`${STRIPE_PAYMENT_LINKS[partner.tier]}?prefilled_email=${encodeURIComponent(partner.email)}`}
                      className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-700"
                    >
                      Complete Payment →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent listings + CTA */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Listings
              </h3>
              <button
                onClick={() => navigate({ to: "/partner/listings" })}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
              >
                + Add Listing
              </button>
            </div>

            {recentListings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">No listings yet.</p>
                <p className="mt-1 text-sm text-gray-400">
                  Add your first product to start appearing in AI
                  recommendations.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 pr-4 font-medium text-gray-500">
                        Name
                      </th>
                      <th className="pb-3 pr-4 font-medium text-gray-500">
                        Category
                      </th>
                      <th className="pb-3 font-medium text-gray-500">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentListings.map((l) => (
                      <tr key={l.id} className="border-b border-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {l.name}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {l.category}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {recentListings.length > 0 && (
              <div className="mt-4 text-right">
                <button
                  onClick={() => navigate({ to: "/partner/listings" })}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View all listings →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PartnerLayout>
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
        <span className="text-indigo-400">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </span>
      </div>
      <p className={`text-2xl font-bold text-gray-900 ${accent ?? ""}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

function ChecklistItem({
  done,
  label,
  detail,
  action,
}: {
  done: boolean;
  label: string;
  detail?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
          done
            ? "bg-green-100 text-green-600"
            : "border-2 border-dashed border-gray-300 text-gray-300"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${
            done ? "text-gray-500 line-through" : "text-gray-900"
          }`}
        >
          {label}
        </span>
        {detail && (
          <span className="ml-2 text-xs text-gray-400">{detail}</span>
        )}
        {action && (
          <div className="mt-1">
            {action.href ? (
              <a
                href={action.href}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {action.label}
              </a>
            ) : action.onClick ? (
              <button
                onClick={action.onClick}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {action.label}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </li>
  );
}
