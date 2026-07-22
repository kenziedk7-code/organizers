/**
 * Amazon Product Advertising API v5 client.
 *
 * Implements AWS Signature V4 authentication required by PAAPI.
 * Falls back to mock data when credentials are not set or the API call fails.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface PaapiConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  region: string;
}

export interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string;
  price: string;
  detailPageUrl: string;
}

export interface SearchItemsResult {
  products: AmazonProduct[];
  error?: string;
}

// ── Config ─────────────────────────────────────────────────────────────

function getConfig(): PaapiConfig | null {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;
  const region = process.env.AMAZON_REGION || "us-east-1";

  if (!accessKey || !secretKey || !partnerTag) {
    return null;
  }

  return { accessKey, secretKey, partnerTag, region };
}

// ── AWS Signature V4 ──────────────────────────────────────────────────

function sha256Hex(data: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(data);
  return hasher.digest("hex");
}

function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer {
  const crypto = require("node:crypto");
  const kDate = crypto
    .createHmac("sha256", `AWS4${secretKey}`)
    .update(dateStamp)
    .digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto
    .createHmac("sha256", kRegion)
    .update(service)
    .digest();
  const kSigning = crypto
    .createHmac("sha256", kService)
    .update("aws4_request")
    .digest();
  return kSigning;
}

function buildAuthHeaders(
  config: PaapiConfig,
  payload: string,
): Record<string, string> {
  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[:-]/g, "")
    .replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);

  const service = "ProductAdvertisingAPI";
  const host = `webservices.amazon.${config.region}`;
  const target =
    "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
  const contentType = "application/json; charset=UTF-8";

  const payloadHash = sha256Hex(payload);

  // Canonical request
  const canonicalUri = "/paapi5/searchitems";
  const canonicalQuerystring = "";
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${target}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST",
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders + "\n",
    signedHeaders,
    payloadHash,
  ].join("\n");

  // String to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`;
  const hashedCanonicalRequest = sha256Hex(canonicalRequest);

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // Signing key
  const signingKey = getSignatureKey(
    config.secretKey,
    dateStamp,
    config.region,
    service,
  );
  const crypto = require("node:crypto");
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const authHeader =
    `${algorithm} ` +
    `Credential=${config.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  return {
    "Content-Type": contentType,
    Host: host,
    "X-Amz-Date": amzDate,
    "X-Amz-Target": target,
    Authorization: authHeader,
  };
}

// ── API Call ───────────────────────────────────────────────────────────

async function callSearchItems(
  config: PaapiConfig,
  keywords: string,
): Promise<SearchItemsResult> {
  const host = `webservices.amazon.${config.region}`;
  const url = `https://${host}/paapi5/searchitems`;

  const payload = JSON.stringify({
    Keywords: keywords,
    SearchIndex: "All",
    ItemCount: 1,
    Resources: [
      "Images.Primary.Medium",
      "ItemInfo.Title",
      "ItemInfo.Features",
      "Offers.Listings.Price",
    ],
    PartnerTag: config.partnerTag,
    PartnerType: "Associates",
    Marketplace: "www.amazon.com",
  });

  const headers = buildAuthHeaders(config, payload);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!response.ok) {
    const errText = await response.text();
    return { products: [], error: `PAAPI error ${response.status}: ${errText}` };
  }

  const data = await response.json();

  const items = data?.SearchResult?.Items ?? [];
  const products: AmazonProduct[] = items.map((item: any) => {
    const asin = item.ASIN ?? "";
    const title =
      item?.ItemInfo?.Title?.DisplayValue ?? "Untitled Product";
    const imageUrl =
      item?.Images?.Primary?.Medium?.URL ?? "";
    const price =
      item?.Offers?.Listings?.[0]?.Price?.DisplayAmount ?? "";
    const detailPageUrl = item?.DetailPageURL ?? `https://www.amazon.com/dp/${asin}`;
    // Append affiliate tag if not already present
    const affiliateUrl = detailPageUrl.includes("tag=")
      ? detailPageUrl
      : detailPageUrl.includes("?")
        ? `${detailPageUrl}&tag=${config.partnerTag}`
        : `${detailPageUrl}?tag=${config.partnerTag}`;

    return { asin, title, imageUrl, price, detailPageUrl: affiliateUrl };
  });

  return { products };
}

// ── Mock fallback (no API credentials needed) ──────────────────────────

function mockSearchItems(keywords: string): SearchItemsResult {
  // Generate deterministic-ish mock based on keywords
  const hash = keywords
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const mockProducts: AmazonProduct[] = [
    {
      asin: `B0${String(hash % 100000).padStart(5, "0")}XYZ`,
      title: keywords
        .split("+")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      imageUrl: `https://picsum.photos/seed/${hash}/300/300`,
      price: `$${(9.99 + (hash % 30)).toFixed(2)}`,
      detailPageUrl: `https://www.amazon.com/s?k=${keywords}`,
    },
  ];

  return { products: mockProducts };
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Search Amazon for a product by keywords.
 * Falls back to mock data if credentials aren't set or the API call fails.
 */
export async function searchAmazonProducts(
  keywords: string,
): Promise<SearchItemsResult> {
  const config = getConfig();

  if (!config) {
    // No credentials — use mock data
    return mockSearchItems(keywords);
  }

  try {
    const result = await callSearchItems(config, keywords);
    if (result.error || result.products.length === 0) {
      // PAAPI failed or returned nothing — fall back to mock
      console.warn(
        `PAAPI: ${result.error || "no results"} for "${keywords}" — using mock`,
      );
      return mockSearchItems(keywords);
    }
    return result;
  } catch (err) {
    console.error("PAAPI call failed:", err);
    return mockSearchItems(keywords);
  }
}

/**
 * Extract search keywords from an Amazon search URL.
 * e.g. "https://www.amazon.com/s?k=stackable+shoe+rack" → "stackable shoe rack"
 */
export function extractSearchTerms(url: string): string {
  try {
    const u = new URL(url);
    const k = u.searchParams.get("k");
    if (k) return k.replace(/\+/g, " ");
    // Try to extract from path
    const parts = u.pathname.split("/");
    const last = parts[parts.length - 1];
    return last || url;
  } catch {
    return url;
  }
}
