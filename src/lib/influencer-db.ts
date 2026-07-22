import { createServerFn } from "@tanstack/react-start";
import { Database } from "bun:sqlite";
import path from "node:path";
import bcrypt from "bcryptjs";
import { TIERS, type TierKey } from "./partner-db";

// ── Types ─────────────────────────────────────────────────────────────

export interface Influencer {
  id: number;
  name: string;
  email: string;
  socialHandle: string | null;
  platform: string | null;
  referralCode: string;
  totalCommissionCents: number;
  createdAt: string;
}

export interface Referral {
  id: number;
  influencerId: number;
  partnerId: number;
  partnerTier: string;
  commissionCents: number;
  status: "pending" | "paid";
  partnerBusinessName: string;
  partnerSignupDate: string;
  createdAt: string;
}

// ── Commission config ─────────────────────────────────────────────────

export const INFLUENCER_COMMISSION_RATE = 0.10; // 10%

export function getCommissionForTier(tier: TierKey): number {
  return Math.round(TIERS[tier].price * 100 * INFLUENCER_COMMISSION_RATE);
}

// ── SQLite setup ──────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "partner-data.sqlite");

function getDb(): Database {
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  return db;
}

function ensureInfluencerTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS influencers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      social_handle TEXT,
      platform TEXT,
      referral_code TEXT NOT NULL UNIQUE,
      total_commission_cents INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS influencer_sessions (
      token TEXT PRIMARY KEY,
      influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      influencer_id INTEGER NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
      partner_id INTEGER NOT NULL,
      partner_tier TEXT NOT NULL,
      commission_cents INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migration: add referral_code to partners table
  try {
    db.exec("ALTER TABLE partners ADD COLUMN referral_code TEXT");
  } catch (_) {
    // column already exists — fine
  }
}

// ── Generate referral code ────────────────────────────────────────────

function generateReferralCode(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SCAN-${clean}${random}`;
}

// ── Influencer Signup ─────────────────────────────────────────────────

export const influencerSignup = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as {
      name: string;
      email: string;
      password: string;
      socialHandle?: string;
      platform?: string;
    };
    if (!d?.name || !d?.email || !d?.password) {
      throw new Error("Name, email, and password are required");
    }
    if (d.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureInfluencerTables(db);
    const hash = await bcrypt.hash(data.password, 10);

    // Check if email already exists
    const existing = db.query("SELECT id FROM influencers WHERE email = ?").get(data.email);
    if (existing) {
      db.close();
      throw new Error("An influencer account with this email already exists");
    }

    // Generate unique referral code
    let referralCode = generateReferralCode(data.name);
    let attempts = 0;
    while (db.query("SELECT id FROM influencers WHERE referral_code = ?").get(referralCode) && attempts < 10) {
      referralCode = generateReferralCode(data.name + attempts);
      attempts++;
    }

    const result = db.query(
      `INSERT INTO influencers (name, email, password_hash, social_handle, platform, referral_code)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, name, email, social_handle, platform, referral_code, total_commission_cents, created_at`
    ).get(
      data.name,
      data.email,
      hash,
      data.socialHandle || null,
      data.platform || null,
      referralCode
    ) as any;

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.query(
      "INSERT INTO influencer_sessions (token, influencer_id, expires_at) VALUES (?, ?, ?)"
    ).run(token, result.id, expiresAt);

    db.close();

    return {
      token,
      influencer: {
        id: result.id,
        name: result.name,
        email: result.email,
        socialHandle: result.social_handle,
        platform: result.platform,
        referralCode: result.referral_code,
        totalCommissionCents: result.total_commission_cents,
        createdAt: result.created_at,
      } as Influencer,
    };
  });

// ── Influencer Login ──────────────────────────────────────────────────

export const influencerLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { email: string; password: string };
    if (!d?.email || !d?.password) {
      throw new Error("Email and password are required");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureInfluencerTables(db);

    const row = db.query("SELECT * FROM influencers WHERE email = ?").get(data.email) as any;
    if (!row) {
      db.close();
      throw new Error("Invalid email or password");
    }

    const valid = await bcrypt.compare(data.password, row.password_hash);
    if (!valid) {
      db.close();
      throw new Error("Invalid email or password");
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.query(
      "INSERT OR REPLACE INTO influencer_sessions (token, influencer_id, expires_at) VALUES (?, ?, ?)"
    ).run(token, row.id, expiresAt);

    db.close();

    return {
      token,
      influencer: {
        id: row.id,
        name: row.name,
        email: row.email,
        socialHandle: row.social_handle,
        platform: row.platform,
        referralCode: row.referral_code,
        totalCommissionCents: row.total_commission_cents,
        createdAt: row.created_at,
      } as Influencer,
    };
  });

// ── Influencer Logout ─────────────────────────────────────────────────

export const influencerLogout = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureInfluencerTables(db);
    db.query("DELETE FROM influencer_sessions WHERE token = ?").run(data.token);
    db.close();
    return { success: true };
  });

// ── Get Session Influencer ────────────────────────────────────────────

export const getSessionInfluencer = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureInfluencerTables(db);

    const row = db.query(`
      SELECT i.*, s.expires_at as session_expires
      FROM influencer_sessions s
      JOIN influencers i ON i.id = s.influencer_id
      WHERE s.token = ?
    `).get(data.token) as any;

    if (!row) {
      db.close();
      throw new Error("Invalid session");
    }

    if (new Date(row.session_expires) < new Date()) {
      db.query("DELETE FROM influencer_sessions WHERE token = ?").run(data.token);
      db.close();
      throw new Error("Session expired");
    }

    db.close();

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      socialHandle: row.social_handle,
      platform: row.platform,
      referralCode: row.referral_code,
      totalCommissionCents: row.total_commission_cents,
      createdAt: row.created_at,
    } as Influencer;
  });

// ── Get influencer by referral code ───────────────────────────────────

export function lookupInfluencerByCode(db: Database, code: string): {
  id: number;
  name: string;
} | null {
  const row = db.query("SELECT id, name FROM influencers WHERE referral_code = ?").get(code) as any;
  return row ? { id: row.id, name: row.name } : null;
}

// ── Create referral record ────────────────────────────────────────────

export function createReferral(db: Database, influencerId: number, partnerId: number, tier: TierKey): number {
  const commissionCents = getCommissionForTier(tier);
  const result = db.query(
    `INSERT INTO referrals (influencer_id, partner_id, partner_tier, commission_cents, status)
     VALUES (?, ?, ?, ?, 'pending')
     RETURNING id`
  ).get(influencerId, partnerId, tier, commissionCents) as any;

  // Update influencer total
  db.query(
    "UPDATE influencers SET total_commission_cents = total_commission_cents + ? WHERE id = ?"
  ).run(commissionCents, influencerId);

  return result.id;
}

// ── Get influencer dashboard data ─────────────────────────────────────

export const getInfluencerDashboard = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureInfluencerTables(db);

    // Validate session
    const session = db.query(
      "SELECT influencer_id FROM influencer_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(data.token) as any;
    if (!session) {
      db.close();
      throw new Error("Invalid or expired session");
    }

    const influencerId = session.influencer_id;

    // Get influencer
    const influencer = db.query(
      "SELECT * FROM influencers WHERE id = ?"
    ).get(influencerId) as any;

    // Get referrals with partner info
    const referrals = db.query(`
      SELECT r.*, p.business_name, p.created_at as partner_signup_date
      FROM referrals r
      LEFT JOIN partners p ON p.id = r.partner_id
      WHERE r.influencer_id = ?
      ORDER BY r.created_at DESC
    `).all(influencerId) as any[];

    db.close();

    return {
      influencer: {
        id: influencer.id,
        name: influencer.name,
        email: influencer.email,
        socialHandle: influencer.social_handle,
        platform: influencer.platform,
        referralCode: influencer.referral_code,
        totalCommissionCents: influencer.total_commission_cents,
        createdAt: influencer.created_at,
      } as Influencer,
      referrals: referrals.map((r) => ({
        id: r.id,
        influencerId: r.influencer_id,
        partnerId: r.partner_id,
        partnerTier: r.partner_tier,
        commissionCents: r.commission_cents,
        status: r.status as "pending" | "paid",
        partnerBusinessName: r.business_name || "Unknown",
        partnerSignupDate: r.partner_signup_date || r.created_at,
        createdAt: r.created_at,
      })) as Referral[],
    };
  });

// ── Get influencer by referral code (public) ──────────────────────────

export const getInfluencerByCode = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { code: string };
    if (!d?.code) throw new Error("Referral code required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureInfluencerTables(db);
    const row = db.query("SELECT id, name FROM influencers WHERE referral_code = ?").get(data.code) as any;
    db.close();
    if (!row) throw new Error("Invalid referral code");
    return { id: row.id, name: row.name };
  });
