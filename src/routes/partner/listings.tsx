import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  getListings,
  createListing,
  updateListing,
  deleteListing,
  getPartnerStats,
  TIERS,
  type ProductListing,
} from "../../lib/partner-db";
import { PartnerLayout } from "./signup";

const CATEGORIES = [
  "closet",
  "kitchen",
  "garage",
  "office",
  "bathroom",
  "pantry",
  "bedroom",
  "living room",
  "laundry",
  "other",
] as const;

export const Route = createFileRoute("/partner/listings")({
  component: ListingManager,
});

function ListingManager() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [stats, setStats] = useState<{ listingCount: number; maxListings: number | string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProductListing | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "closet",
    whyItFits: "",
    purchaseUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
      const [listingsData, statsData] = await Promise.all([
        getListings({ data: { token } }),
        getPartnerStats({ data: { token } }),
      ]);
      setListings(listingsData);
      setStats({ listingCount: statsData.listingCount, maxListings: statsData.maxListings });
    } catch (err) {
      if (err instanceof Error && (err.message.includes("Invalid") || err.message.includes("expired"))) {
        navigate({ to: "/partner/login" });
      } else {
        setError(err instanceof Error ? err.message : "Failed to load listings");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    const max = stats?.maxListings;
    if (max !== "Unlimited" && stats && stats.listingCount >= Number(max)) {
      setError(`You've reached your tier limit (${max} listings). Upgrade to add more.`);
      return;
    }
    setEditing(null);
    setForm({ name: "", description: "", category: "closet", whyItFits: "", purchaseUrl: "" });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (listing: ProductListing) => {
    setEditing(listing);
    setForm({
      name: listing.name,
      description: listing.description,
      category: listing.category,
      whyItFits: listing.whyItFits,
      purchaseUrl: listing.purchaseUrl,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const token = getToken();
    if (!token) {
      navigate({ to: "/partner/login" });
      return;
    }

    try {
      if (editing) {
        await updateListing({ data: { token, id: editing.id, ...form } });
      } else {
        await createListing({ data: { token, ...form } });
      }
      closeModal();
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (listing: ProductListing) => {
    if (!confirm(`Delete "${listing.name}"? This cannot be undone.`)) return;

    const token = getToken();
    if (!token) return;

    try {
      await deleteListing({ data: { token, id: listing.id } });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
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

  return (
    <PartnerLayout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Listings</h2>
          <p className="text-sm text-gray-500">
            {stats
              ? `${stats.listingCount} of ${stats.maxListings} used`
              : "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/partner/dashboard" })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
          >
            ← Dashboard
          </button>
          <button
            onClick={openAddModal}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700"
          >
            + Add Listing
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 underline hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Listings table */}
      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">No listings yet.</p>
          <button
            onClick={openAddModal}
            className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add your first listing
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 font-medium text-gray-500">Name</th>
                <th className="px-5 py-3 font-medium text-gray-500">Category</th>
                <th className="px-5 py-3 font-medium text-gray-500 hidden sm:table-cell">
                  Purchase URL
                </th>
                <th className="px-5 py-3 font-medium text-gray-500 hidden md:table-cell">
                  Updated
                </th>
                <th className="px-5 py-3 text-right font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{l.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                      {l.description}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {l.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-xs text-gray-400 max-w-[180px] truncate block">
                      {l.purchaseUrl || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                    {new Date(l.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => openEditModal(l)}
                      className="mr-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(l)}
                      className="text-sm font-medium text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-10 pb-10">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <form onSubmit={handleSave}>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? "Edit Listing" : "New Listing"}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 px-6 py-4">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="e.g., 2-Tier Stackable Shoe Rack"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Brief product description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Why It Fits
                  </label>
                  <textarea
                    value={form.whyItFits}
                    onChange={(e) => setForm({ ...form, whyItFits: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Why this product works for organizing..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase URL
                  </label>
                  <input
                    type="url"
                    value={form.purchaseUrl}
                    onChange={(e) => setForm({ ...form, purchaseUrl: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="https://www.amazon.com/..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PartnerLayout>
  );
}
