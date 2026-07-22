import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  getAllPartners,
  adminActivatePartner,
  TIERS,
  type Partner,
  type TierKey,
} from "../../lib/partner-db";

export const Route = createFileRoute("/partner/admin")({
  component: PartnerAdmin,
});

function PartnerAdmin() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPartners();
      setPartners(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const handleActivate = async (partnerId: number) => {
    setActivating((prev) => new Set(prev).add(partnerId));
    setMessage(null);
    try {
      await adminActivatePartner({ data: { partnerId } });
      setMessage(`Partner #${partnerId} activated successfully.`);
      // Refresh the list
      await loadPartners();
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Activation failed"}`
      );
    } finally {
      setActivating((prev) => {
        const next = new Set(prev);
        next.delete(partnerId);
        return next;
      });
    }
  };

  const pendingCount = partners.filter(
    (p) => p.paymentStatus === "pending"
  ).length;
  const paidCount = partners.filter(
    (p) => p.paymentStatus === "paid"
  ).length;

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
              A
            </div>
            <span className="text-lg font-semibold text-gray-900">
              ScanSort Admin
            </span>
          </div>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
            Hidden — not linked in navigation
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Partner Payment Activation
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manually activate partner accounts whose payments have been
              confirmed.
            </p>
          </div>
          <button
            onClick={loadPartners}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total Partners
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {partners.length}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
              Pending Activation
            </p>
            <p className="mt-1 text-3xl font-bold text-amber-700">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-green-600">
              Active (Paid)
            </p>
            <p className="mt-1 text-3xl font-bold text-green-700">
              {paidCount}
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm ${
              message.startsWith("Error")
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Partners Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
            </div>
          ) : partners.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500">No partners found.</p>
              <p className="mt-1 text-sm text-gray-400">
                Partners will appear here after they sign up.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Business Name
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Tier</th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Signup Date
                  </th>
                  <th className="px-6 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      #{p.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {p.businessName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.email}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {TIERS[p.tier as TierKey]?.name ?? p.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.paymentStatus === "paid"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            p.paymentStatus === "paid"
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                        />
                        {p.paymentStatus === "paid" ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {p.paymentStatus === "pending" ? (
                        <button
                          onClick={() => handleActivate(p.id)}
                          disabled={activating.has(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-60"
                        >
                          {activating.has(p.id) ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Activating...
                            </>
                          ) : (
                            "Activate"
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          ✓ Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
