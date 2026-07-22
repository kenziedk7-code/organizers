import crypto from "node:crypto";
import { Database } from "bun:sqlite";
import path from "node:path";

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
}

function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;
    parts[part.slice(0, eqIdx).trim()] = part.slice(eqIdx + 1).trim();
  }

  const timestamp = parts["t"];
  const sigV1 = parts["v1"];
  if (!timestamp || !sigV1) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(sigV1),
    );
  } catch {
    return false;
  }
}

export async function handleStripeWebhook(
  req: Request,
): Promise<Response> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  // Read raw body for signature verification
  const rawBody = await req.text();

  // Verify signature if secret and header are present
  if (webhookSecret && signature) {
    if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (!webhookSecret) {
    console.warn(
      "[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification",
    );
  }

  // Parse the event
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("[stripe-webhook] Received event:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const customerEmail =
      session?.customer_details?.email || session?.customer_email;

    if (!customerEmail) {
      console.warn(
        "[stripe-webhook] No customer email found in checkout session",
      );
      return new Response(
        JSON.stringify({ error: "No customer email in session" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("[stripe-webhook] Marking partner as paid:", customerEmail);

    try {
      const db = getDb();
      ensureTables(db);

      const result = db
        .query("UPDATE partners SET payment_status = 'paid' WHERE email = ?")
        .run(customerEmail);

      db.close();

      if (result.changes === 0) {
        console.warn(
          "[stripe-webhook] No partner found with email:",
          customerEmail,
        );
        return new Response(
          JSON.stringify({
            warning: "No partner found with that email",
            email: customerEmail,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      console.log(
        "[stripe-webhook] Successfully activated partner:",
        customerEmail,
      );
    } catch (err) {
      console.error("[stripe-webhook] Database error:", err);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
