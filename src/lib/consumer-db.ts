import { createServerFn } from "@tanstack/react-start";
import { Database } from "bun:sqlite";
import path from "node:path";
import bcrypt from "bcryptjs";
import type { SpaceAnalysis } from "./analyze";

// ── Types ─────────────────────────────────────────────────────────────

export interface Consumer {
  id: number;
  email: string;
  hasPassword: boolean; // false for email-only signups
  createdAt: string;
}

export interface ScanRecord {
  id: number;
  consumerId: number | null;
  spaceType: string;
  recommendationCount: number;
  createdAt: string;
  analysis: SpaceAnalysis; // full stored analysis
}

// ── SQLite setup ──────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "partner-data.sqlite");

function getDb(): Database {
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  return db;
}

function ensureConsumerTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS consumer_sessions (
      token TEXT PRIMARY KEY,
      consumer_id INTEGER NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consumer_id INTEGER REFERENCES consumers(id) ON DELETE SET NULL,
      space_type TEXT NOT NULL DEFAULT '',
      image_data TEXT,
      recommendations_json TEXT NOT NULL DEFAULT '{}',
      recommendation_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// ── Consumer Signup ───────────────────────────────────────────────────

export const consumerSignup = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { email: string; password?: string };
    if (!d?.email || !d.email.includes("@")) {
      throw new Error("A valid email is required");
    }
    if (d.password && d.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);

    const existing = db.query("SELECT id FROM consumers WHERE email = ?").get(data.email);
    if (existing) {
      db.close();
      throw new Error("An account with this email already exists. Please log in instead.");
    }

    const hash = data.password ? await bcrypt.hash(data.password, 10) : null;

    const result = db.query(
      "INSERT INTO consumers (email, password_hash) VALUES (?, ?) RETURNING id, email, password_hash, created_at"
    ).get(data.email, hash) as any;

    // Create session
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.query(
      "INSERT INTO consumer_sessions (token, consumer_id, expires_at) VALUES (?, ?, ?)"
    ).run(token, result.id, expiresAt);

    db.close();

    return {
      token,
      consumer: {
        id: result.id,
        email: result.email,
        hasPassword: !!result.password_hash,
        createdAt: result.created_at,
      },
    };
  });

// ── Consumer Login ────────────────────────────────────────────────────

export const consumerLogin = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { email: string; password: string };
    if (!d?.email || !d?.password) {
      throw new Error("Email and password are required");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);

    const row = db.query("SELECT * FROM consumers WHERE email = ?").get(data.email) as any;
    if (!row) {
      db.close();
      throw new Error("Invalid email or password");
    }

    if (!row.password_hash) {
      db.close();
      throw new Error(
        "This account was created without a password. Please sign up again with a password, or use email-only signup."
      );
    }

    const valid = await bcrypt.compare(data.password, row.password_hash);
    if (!valid) {
      db.close();
      throw new Error("Invalid email or password");
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.query(
      "INSERT OR REPLACE INTO consumer_sessions (token, consumer_id, expires_at) VALUES (?, ?, ?)"
    ).run(token, row.id, expiresAt);

    db.close();

    return {
      token,
      consumer: {
        id: row.id,
        email: row.email,
        hasPassword: !!row.password_hash,
        createdAt: row.created_at,
      },
    };
  });

// ── Consumer Logout ───────────────────────────────────────────────────

export const consumerLogout = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);
    db.query("DELETE FROM consumer_sessions WHERE token = ?").run(data.token);
    db.close();
    return { success: true };
  });

// ── Get Session Consumer ──────────────────────────────────────────────

export const getSessionConsumer = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);

    const row = db.query(`
      SELECT c.*, s.expires_at as session_expires
      FROM consumer_sessions s
      JOIN consumers c ON c.id = s.consumer_id
      WHERE s.token = ?
    `).get(data.token) as any;

    if (!row) {
      db.close();
      throw new Error("Invalid session");
    }

    if (new Date(row.session_expires) < new Date()) {
      db.query("DELETE FROM consumer_sessions WHERE token = ?").run(data.token);
      db.close();
      throw new Error("Session expired");
    }

    db.close();

    return {
      id: row.id,
      email: row.email,
      hasPassword: !!row.password_hash,
      createdAt: row.created_at,
    } as Consumer;
  });

// ── Save Scan ─────────────────────────────────────────────────────────

export const saveScan = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as {
      token: string;
      spaceType: string;
      imageData?: string;
      analysis: SpaceAnalysis;
    };
    if (!d?.token) throw new Error("Token required");
    if (!d?.analysis) throw new Error("Analysis data is required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);

    // Validate session
    const session = db.query(
      "SELECT consumer_id FROM consumer_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(data.token) as any;
    if (!session) {
      db.close();
      throw new Error("Invalid or expired session");
    }

    const recommendationCount = data.analysis.recommendations?.length ?? 0;
    const analysisJson = JSON.stringify(data.analysis);

    const result = db.query(
      `INSERT INTO scans (consumer_id, space_type, image_data, recommendations_json, recommendation_count)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, space_type, recommendation_count, created_at`
    ).get(
      session.consumer_id,
      data.spaceType || "",
      data.imageData || null,
      analysisJson,
      recommendationCount
    ) as any;

    db.close();

    return {
      id: result.id,
      consumerId: session.consumer_id,
      spaceType: result.space_type,
      recommendationCount: result.recommendation_count,
      createdAt: result.created_at,
    };
  });

// ── Get Consumer Scans ────────────────────────────────────────────────

export const getConsumerScans = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string };
    if (!d?.token) throw new Error("Token required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);

    // Validate session
    const session = db.query(
      "SELECT consumer_id FROM consumer_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(data.token) as any;
    if (!session) {
      db.close();
      throw new Error("Invalid or expired session");
    }

    const rows = db.query(
      "SELECT id, consumer_id, space_type, recommendations_json, recommendation_count, created_at FROM scans WHERE consumer_id = ? ORDER BY created_at DESC"
    ).all(session.consumer_id) as any[];

    db.close();

    return rows.map((r) => ({
      id: r.id,
      consumerId: r.consumer_id,
      spaceType: r.space_type,
      recommendationCount: r.recommendation_count,
      createdAt: r.created_at,
      analysis: JSON.parse(r.recommendations_json) as SpaceAnalysis,
    })) as ScanRecord[];
  });

// ── Get Single Scan ───────────────────────────────────────────────────

export const getScan = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const d = input as { token: string; scanId: number };
    if (!d?.token) throw new Error("Token required");
    if (!d?.scanId) throw new Error("Scan ID required");
    return d;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    ensureConsumerTables(db);

    const session = db.query(
      "SELECT consumer_id FROM consumer_sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(data.token) as any;
    if (!session) {
      db.close();
      throw new Error("Invalid or expired session");
    }

    const row = db.query(
      "SELECT id, consumer_id, space_type, recommendations_json, recommendation_count, created_at FROM scans WHERE id = ? AND consumer_id = ?"
    ).get(data.scanId, session.consumer_id) as any;

    db.close();

    if (!row) throw new Error("Scan not found");

    return {
      id: row.id,
      consumerId: row.consumer_id,
      spaceType: row.space_type,
      recommendationCount: row.recommendation_count,
      createdAt: row.created_at,
      analysis: JSON.parse(row.recommendations_json) as SpaceAnalysis,
    } as ScanRecord;
  });
