import { createServerFn } from "@tanstack/react-start";
import { Database } from "bun:sqlite";
import path from "node:path";
import bcrypt from "bcryptjs";
import { notifyTeamNewPartner, sendWelcomeEmail } from "./email";

// ── Types ─────────────────────────────────────────────────────────────

export interface Partner {
  id: number;
  businessName: string;
  email: string;
  tier: TierKey;
  paymentStatus: "pending" | "paid";
  createdAt: string;
}

export interface ProductListing {
  id: number;
  partnerId: number;
  name: string;
  description: string;
  category: string;
  whyItFits: string;
  purchaseUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Tier config
export const TIERS = {
  starter: { name: "Starter", price: 99, maxListings: 5 },
  growth: { name: "Growth", price: 299, maxListings: 25 },
  pro: { name: "Pro", price: 699, maxListings: Infinity },
} as const;

export type TierKey = keyof typeof TIERS;

// ── SQLite setup ──────────────────────────────────────────────────────

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
  // Migration: add payment_status to existing databases that don't have it yet
  try {
    db.exec("ALTER TABLE partners ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending'");
  } catch (_) {
    // column already exists — fine
  }
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS partner_sessions (
      token TEXT PRIMARY KEY,
      partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    )
  `);
}

// ── Partner Signup ────────────────────────────────────────────────────

export const partnerSignup = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as {
      businessName: string;
      email: string;
      password: string;
      tier: TierKey;
    };
    if (!d?.businessName || !d?.email || !d?.password || !d?.tier) {
      throw new Error("All fields are required");
    }
    if (!["starter", "growth", "pro"].includes(d.tier)) {
      throw new Error("Invalid tier");
    }
    if (d.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const hash = await bcrypt.hash(data.password, 10);

    // Check if email already exists
    const existing = db.query("SELECT id FROM partners WHERE email = ?").get(data.email);
    if (existing) {
      db.close();
      throw new Error("A partner with this email already exists");
    }

    const result = db.query(
      "INSERT INTO partners (business_name, email, password_hash, tier, payment_status) VALUES (?, ?, ?, ?, 'pending') RETURNING id, business_name, email, tier, payment_status, created_at"
    ).get(data.businessName, data.email, hash, data.tier) as any;

    db.close();

    const partner = {
      id: result.id,
      businessName: result.business_name,
      email: result.email,
      tier: result.tier as TierKey,
      paymentStatus: result.payment_status as "pending" | "paid",
      createdAt: result.created_at,
    };

    // Send emails (fire-and-forget — don't block signup on email delivery)
    Promise.allSettled([
      notifyTeamNewPartner({
        businessName: partner.businessName,
        email: partner.email,
        tier: TIERS[partner.tier].name,
        signupDate: partner.createdAt,
      }),
      sendWelcomeEmail({
        businessName: partner.businessName,
        email: partner.email,
        tier: partner.tier,
      }),
    ]).catch(() => {});

    return partner;
  });

// ── Auth ───────────────────────────────────────────────────────────────

export const partnerLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { email: string; password: string };
    if (!d?.email || !d?.password) {
      throw new Error("Email and password are required");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);

    const row = db.query("SELECT * FROM partners WHERE email = ?").get(data.email) as any;
    if (!row) {
      db.close();
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(data.password, row.password_hash);
    if (!valid) {
      db.close();
      throw new Error("Invalid email or password");
    }

    // Create session token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.query(
      "INSERT OR REPLACE INTO partner_sessions (token, partner_id, expires_at) VALUES (?, ?, ?)"
    ).run(token, row.id, expiresAt);

    db.close();

    return {
      token,
      partner: {
        id: row.id,
        businessName: row.business_name,
        email: row.email,
        tier: row.tier as TierKey,
        paymentStatus: (row.payment_status || "pending") as "pending" | "paid",
        createdAt: row.created_at,
      },
    };
  });

export const partnerLogout = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    db.query("DELETE FROM partner_sessions WHERE token = ?").run(data.token);
    db.close();
    return { success: true };
  });

export const getSessionPartner = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);

    const row = db.query(`
      SELECT p.*, s.expires_at as session_expires
      FROM partner_sessions s
      JOIN partners p ON p.id = s.partner_id
      WHERE s.token = ?
    `).get(data.token) as any;

    if (!row) {
      db.close();
      throw new Error("Invalid session");
    }

    if (new Date(row.session_expires) < new Date()) {
      db.query("DELETE FROM partner_sessions WHERE token = ?").run(data.token);
      db.close();
      throw new Error("Session expired");
    }

    db.close();

    return {
      id: row.id,
      businessName: row.business_name,
      email: row.email,
      tier: row.tier as TierKey,
      paymentStatus: (row.payment_status || "pending") as "pending" | "paid",
      createdAt: row.created_at,
    };
  });

// ── Listing CRUD ───────────────────────────────────────────────────────

function getPartnerId(db: Database, token: string): number {
  const row = db.query(
    "SELECT partner_id FROM partner_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).get(token) as any;
  if (!row) throw new Error("Invalid or expired session");
  return row.partner_id;
}

export const getListings = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const partnerId = getPartnerId(db, data.token);

    const rows = db.query(
      "SELECT * FROM product_listings WHERE partner_id = ? ORDER BY created_at DESC"
    ).all(partnerId) as any[];

    db.close();

    return rows.map((r) => ({
      id: r.id,
      partnerId: r.partner_id,
      name: r.name,
      description: r.description,
      category: r.category,
      whyItFits: r.why_it_fits,
      purchaseUrl: r.purchase_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })) as ProductListing[];
  });

export const createListing = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as {
      token: string;
      name: string;
      description: string;
      category: string;
      whyItFits: string;
      purchaseUrl: string;
    };
    if (!d?.token || !d?.name) throw new Error("Token and name are required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const partnerId = getPartnerId(db, data.token);

    // Get partner tier for limit check
    const partner = db.query("SELECT tier FROM partners WHERE id = ?").get(partnerId) as any;
    const tierConfig = TIERS[partner.tier as TierKey];

    const countRow = db.query(
      "SELECT COUNT(*) as count FROM product_listings WHERE partner_id = ?"
    ).get(partnerId) as any;
    const currentCount = Number(countRow.count);

    if (currentCount >= tierConfig.maxListings) {
      db.close();
      throw new Error(
        `Tier limit reached: ${tierConfig.name} allows ${tierConfig.maxListings === Infinity ? "unlimited" : tierConfig.maxListings} listings. You currently have ${currentCount}.`,
      );
    }

    const result = db.query(
      `INSERT INTO product_listings (partner_id, name, description, category, why_it_fits, purchase_url)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).get(
      partnerId, data.name, data.description || "", data.category || "closet",
      data.whyItFits || "", data.purchaseUrl || ""
    ) as any;

    db.close();
    return {
      id: result.id,
      partnerId: result.partner_id,
      name: result.name,
      description: result.description,
      category: result.category,
      whyItFits: result.why_it_fits,
      purchaseUrl: result.purchase_url,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    } as ProductListing;
  });

export const updateListing = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as {
      token: string;
      id: number;
      name: string;
      description: string;
      category: string;
      whyItFits: string;
      purchaseUrl: string;
    };
    if (!d?.token || !d?.id || !d?.name) throw new Error("Token, id, and name are required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const partnerId = getPartnerId(db, data.token);

    // Verify ownership
    const existing = db.query(
      "SELECT id FROM product_listings WHERE id = ? AND partner_id = ?"
    ).get(data.id, partnerId) as any;
    if (!existing) {
      db.close();
      throw new Error("Listing not found");
    }

    const result = db.query(
      `UPDATE product_listings
       SET name = ?, description = ?, category = ?, why_it_fits = ?, purchase_url = ?, updated_at = datetime('now')
       WHERE id = ?
       RETURNING *`
    ).get(
      data.name, data.description || "", data.category || "closet",
      data.whyItFits || "", data.purchaseUrl || "", data.id
    ) as any;

    db.close();
    return {
      id: result.id,
      partnerId: result.partner_id,
      name: result.name,
      description: result.description,
      category: result.category,
      whyItFits: result.why_it_fits,
      purchaseUrl: result.purchase_url,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    } as ProductListing;
  });

export const deleteListing = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { token: string; id: number };
    if (!d?.token || !d?.id) throw new Error("Token and id are required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const partnerId = getPartnerId(db, data.token);

    const result = db.query(
      "DELETE FROM product_listings WHERE id = ? AND partner_id = ? RETURNING id"
    ).get(data.id, partnerId) as any;

    db.close();
    if (!result) throw new Error("Listing not found");
    return { success: true };
  });

export const getPartnerStats = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const partnerId = getPartnerId(db, data.token);

    const partner = db.query("SELECT tier FROM partners WHERE id = ?").get(partnerId) as any;
    const tierConfig = TIERS[partner.tier as TierKey];

    const countRow = db.query(
      "SELECT COUNT(*) as count FROM product_listings WHERE partner_id = ?"
    ).get(partnerId) as any;
    const listingCount = Number(countRow.count);

    db.close();

    return {
      tier: partner.tier as TierKey,
      tierName: tierConfig.name,
      listingCount,
      maxListings: tierConfig.maxListings === Infinity ? "Unlimited" : tierConfig.maxListings,
      totalSales: 0, // placeholder
    };
  });

// ── Admin Functions ─────────────────────────────────────────────────────

export const getAllPartners = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getDb();
    ensureTables(db);

    const rows = db.query(
      "SELECT id, business_name, email, tier, payment_status, created_at FROM partners ORDER BY created_at DESC"
    ).all() as any[];

    db.close();

    return rows.map((r) => ({
      id: r.id,
      businessName: r.business_name,
      email: r.email,
      tier: r.tier as TierKey,
      paymentStatus: (r.payment_status || "pending") as "pending" | "paid",
      createdAt: r.created_at,
    })) as Partner[];
  });

export const adminActivatePartner = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { partnerId: number };
    if (!d?.partnerId || typeof d.partnerId !== "number") {
      throw new Error("partnerId (number) is required");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);

    const result = db.query(
      "UPDATE partners SET payment_status = 'paid' WHERE id = ?"
    ).run(data.partnerId);

    db.close();

    if (result.changes === 0) {
      throw new Error("Partner not found");
    }

    return { success: true, paymentStatus: "paid" as const };
  });

// ── Stripe Payment Links ───────────────────────────────────────────────

export const STRIPE_PAYMENT_LINKS: Record<TierKey, string> = {
  starter: "https://buy.stripe.com/dRmeVffAQexkaqh2une7m00",
  growth: "https://buy.stripe.com/aFabJ30FWgFs7e5d91e7m01",
  pro: "https://buy.stripe.com/28E8wRgEU3SG2XP9WPe7m02",
};

// ── Payment Status ─────────────────────────────────────────────────────

export const updatePaymentStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureTables(db);
    const partnerId = getPartnerId(db, data.token);

    db.query(
      "UPDATE partners SET payment_status = 'paid' WHERE id = ?"
    ).run(partnerId);

    db.close();
    return { success: true, paymentStatus: "paid" as const };
  });
