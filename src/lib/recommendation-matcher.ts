import { Database } from "bun:sqlite";
import path from "node:path";

// ── Types ───────────────────────────────────────────────────────────────

export interface PartnerPick {
  id: number;
  name: string;
  description: string;
  whyItFits: string;
  purchaseUrl: string;
  businessName: string;
  paymentStatus: "pending" | "paid";
}

// ── DB helpers ──────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "partner-data.sqlite");

function getDb(): Database {
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  return db;
}

function ensureTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      tier TEXT NOT NULL DEFAULT 'starter',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'closet',
      why_it_fits TEXT NOT NULL DEFAULT '',
      purchase_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// ── Category mapping ────────────────────────────────────────────────────

/**
 * Map AI-detected space types to our simple category tags.
 * E.g. "Reach-in Closet" → ["closet"], "Kitchen Pantry Cabinet" → ["kitchen", "pantry"]
 */
function inferCategoryTags(spaceType: string): string[] {
  const lower = spaceType.toLowerCase();
  const tags: string[] = [];

  if (lower.includes("closet")) tags.push("closet");
  if (lower.includes("pantry")) tags.push("pantry");
  if (lower.includes("kitchen") || lower.includes("cabinet"))
    tags.push("kitchen");
  if (lower.includes("office") || lower.includes("desk")) tags.push("office");
  if (lower.includes("garage")) tags.push("garage");
  if (lower.includes("bathroom")) tags.push("bathroom");
  if (lower.includes("bedroom")) tags.push("bedroom");
  if (lower.includes("living") && lower.includes("room")) tags.push("living-room");
  if (lower.includes("laundry")) tags.push("laundry");

  return tags;
}

// ── Matching query ──────────────────────────────────────────────────────

/**
 * Query partner listings that match the given space type and challenges.
 *
 * Matching strategy:
 * 1. Category match — the listing's category matches one of the tags
 *    inferred from the AI-detected spaceType.
 * 2. Keyword relevance — the listing's whyItFits text contains words
 *    extracted from the AI-identified challenges.
 *
 * Results are sorted with "paid" partners first, then by newest listing,
 * capped at 3.
 */
export function getMatchingListings(
  spaceType: string,
  challenges: string[],
): PartnerPick[] {
  const db = getDb();
  ensureTables(db);

  const categoryTags = inferCategoryTags(spaceType);

  // Extract meaningful keywords from challenges (words > 3 chars)
  const challengeKeywords = challenges.flatMap((c) =>
    c
      .toLowerCase()
      .split(/[^a-zA-Z]+/)
      .filter((w) => w.length > 3),
  );

  // Build WHERE clause: category match OR keyword match
  const conditions: string[] = [];
  const params: string[] = [];

  for (const tag of categoryTags) {
    conditions.push("LOWER(pl.category) = ?");
    params.push(tag);
  }

  // Deduplicate keywords for efficiency
  const uniqueKeywords = [...new Set(challengeKeywords)];
  for (const kw of uniqueKeywords) {
    conditions.push("LOWER(pl.why_it_fits) LIKE ?");
    params.push(`%${kw}%`);
  }

  if (conditions.length === 0) {
    db.close();
    return [];
  }

  const query = `
    SELECT pl.id, pl.name, pl.description, pl.why_it_fits, pl.purchase_url,
           p.business_name, p.payment_status
    FROM product_listings pl
    JOIN partners p ON p.id = pl.partner_id
    WHERE ${conditions.join(" OR ")}
    ORDER BY
      CASE WHEN p.payment_status = 'paid' THEN 0 ELSE 1 END,
      pl.created_at DESC
    LIMIT 3
  `;

  const rows = db.query(query).all(...params) as Array<{
    id: number;
    name: string;
    description: string;
    why_it_fits: string;
    purchase_url: string;
    business_name: string;
    payment_status: string;
  }>;

  db.close();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    whyItFits: r.why_it_fits,
    purchaseUrl: r.purchase_url,
    businessName: r.business_name,
    paymentStatus: r.payment_status as "pending" | "paid",
  }));
}
