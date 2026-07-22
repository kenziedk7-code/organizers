// Email utility for ScanSort notifications.
// Sends email via HTTP fetch to a simple mail API. When no API is configured,
// emails are logged to the server console so they're visible in development.
//
// To wire up real email delivery, set EMAIL_API_URL and EMAIL_API_KEY env vars.
// The expected API accepts: { to, subject, body } as JSON POST.

const TEAM_INBOX = "scansort-85232e52@ctomail.io";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const apiUrl = process.env.EMAIL_API_URL;
  const apiKey = process.env.EMAIL_API_KEY;

  console.log(`[email] To: ${payload.to}`);
  console.log(`[email] Subject: ${payload.subject}`);
  console.log(`[email] Body:\n${payload.body}`);
  console.log(`[email] ---`);

  if (apiUrl) {
    try {
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          body: payload.body,
        }),
      });
      if (!resp.ok) {
        console.error(`[email] API returned ${resp.status}: ${await resp.text()}`);
        return false;
      }
      console.log(`[email] Sent successfully via API`);
      return true;
    } catch (err) {
      console.error(`[email] Failed to send: ${err}`);
      return false;
    }
  }

  // No API configured — just log (emails are visible in server log for dev)
  console.log(`[email] (No EMAIL_API_URL configured — logged only)`);
  return true;
}

/** Notify the team inbox about a new partner signup */
export async function notifyTeamNewPartner(params: {
  businessName: string;
  email: string;
  tier: string;
  signupDate: string;
}) {
  return sendEmail({
    to: TEAM_INBOX,
    subject: `New Partner Signup: ${params.businessName}`,
    body: [
      `A new partner just signed up on ScanSort.`,
      ``,
      `Business Name: ${params.businessName}`,
      `Email: ${params.email}`,
      `Tier: ${params.tier}`,
      `Signup Date: ${params.signupDate}`,
      ``,
      `— ScanSort Partner Portal`,
    ].join("\n"),
  });
}

/** Send welcome email to the new partner */
export async function sendWelcomeEmail(params: {
  businessName: string;
  email: string;
  tier: string;
}) {
  const tierDisplay =
    { starter: "Starter ($99)", growth: "Growth ($299)", pro: "Pro ($699)" }[
      params.tier
    ] || params.tier;

  return sendEmail({
    to: params.email,
    subject: `Welcome to ScanSort, ${params.businessName}!`,
    body: [
      `Hi ${params.businessName},`,
      ``,
      `Welcome to ScanSort! We're excited to have you as a partner.`,
      ``,
      `Here's a summary of your account:`,
      `• Tier: ${tierDisplay}`,
      `• Account created: ${new Date().toLocaleDateString()}`,
      ``,
      `Next steps:`,
      `1. Complete your payment to activate your account`,
      `2. Log in at https://ae3e9d780d0ee776bbb107eec25e3477.ctonew.app/partner/login`,
      `3. Start adding your product listings`,
      `4. Watch your products appear in AI-powered recommendations`,
      ``,
      `Your products will be recommended by AI at the exact moment`,
      `someone needs them — no more guessing what fits.`,
      ``,
      `Questions? Reply to this email and we'll get back to you.`,
      ``,
      `— The ScanSort Team`,
    ].join("\n"),
  });
}
