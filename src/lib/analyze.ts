import { createServerFn } from "@tanstack/react-start";
import {
  searchAmazonProducts,
  extractSearchTerms,
  type AmazonProduct,
} from "./amazon-paapi";
import {
  getMatchingListings,
  type PartnerPick,
} from "./recommendation-matcher";

// Structured output we expect from AI or produce as mock
export interface SpaceAnalysis {
  spaceType: string;
  observations: string;
  challenges: string[];
  recommendations: Recommendation[];
  /** Partner-listed products that match this space (up to 3, paid-first) */
  partnerPicks: PartnerPick[];
}

export interface Recommendation {
  name: string;
  description: string;
  whyItFits: string;
  purchaseLink: string;
  /** Real Amazon product data — populated when PAAPI enrichment succeeds */
  amazonProduct?: AmazonProduct;
}

type AnalysisInput = {
  imageBase64: string;
  mimeType: string;
};

// ── Mock response generator ──────────────────────────────────────────
// Returns varied mock results so the demo feels alive even without an API key.
function mockAnalyze(): SpaceAnalysis {
  const mocks: SpaceAnalysis[] = [
    {
      spaceType: "Reach-in Closet",
      observations:
        "This appears to be a reach-in closet with a mix of hanging rods and overhead shelving. Clothes are hung across two rods, but the upper shelf is cluttered with stacked folded items and loose accessories. Shoes are scattered on the floor with no designated storage, and there is visible unused vertical space above the top shelf.",
      challenges: [
        "Shoes lack a designated home, creating floor clutter",
        "Upper shelves are underutilized and disorganized",
        "No drawer or bin system for small accessories",
        "Seasonal items are mixed in with everyday wear",
      ],
      partnerPicks: [],
      recommendations: [
        {
          name: "2-Tier Stackable Shoe Rack",
          description:
            "Holds 8–10 pairs of shoes in a compact footprint. Adjustable tiers accommodate flats, sneakers, and low heels.",
          whyItFits:
            "The floor area beneath your hanging section has enough clearance. The stackable design lets you expand vertically as your collection grows.",
          purchaseLink: "https://www.amazon.com/s?k=stackable+shoe+rack+2+tier",
        },
        {
          name: "Fabric Storage Bins (Set of 6)",
          description:
            "Collapsible fabric bins with built-in handles, ideal for shelf storage. Neutral colors fit any closet aesthetic.",
          whyItFits:
            "These will corral folded clothes, accessories, and off-season items on your upper shelves, instantly making the space look tidier.",
          purchaseLink: "https://www.amazon.com/s?k=fabric+storage+bins+set+of+6",
        },
        {
          name: "Velvet Hangers (50-Pack)",
          description:
            "Ultra-slim, non-slip velvet hangers that save up to 30% more rod space than plastic hangers.",
          whyItFits:
            "Switching to slim hangers will free up significant hanging space and prevent clothes from slipping off — great for a mixed wardrobe.",
          purchaseLink: "https://www.amazon.com/s?k=velvet+hangers+50+pack",
        },
        {
          name: "Over-the-Door Organizer with Pockets",
          description:
            "Hangs over the closet door with 24 clear pockets for shoes, scarves, belts, and accessories.",
          whyItFits:
            "Uses entirely unused door space, giving small accessories a visible, easy-to-reach home without taking shelf or floor room.",
          purchaseLink: "https://www.amazon.com/s?k=over+the+door+organizer+24+pockets",
        },
        {
          name: "LED Closet Light Bar",
          description:
            "Motion-sensing, rechargeable LED bar that sticks magnetically or screws into place. Brightens dark closet corners.",
          whyItFits:
            "If your closet is dim, this makes finding items faster and the whole space feel more premium.",
          purchaseLink: "https://www.amazon.com/s?k=motion+sensor+led+closet+light+bar",
        },
      ],
    },
    {
      spaceType: "Kitchen Pantry Cabinet",
      observations:
        "This looks like a deep pantry cabinet with fixed shelves. Cans, boxes, and bags are stacked directly on shelves with no bins or risers. Items are pushed to the back and likely forgotten. Spices are scattered across two different shelves.",
      challenges: [
        "Deep shelves cause items to get lost in the back",
        "No can or spice organization — items are mixed together",
        "Bags and pouches are loose and prone to spilling",
        "Lack of labeling makes restocking confusing",
      ],
      partnerPicks: [],
      recommendations: [
        {
          name: "3-Tier Expandable Shelf Riser",
          description:
            "Creates stepped levels on a single shelf so cans and jars at the back remain visible. Expands from 15 to 27 inches wide.",
          whyItFits:
            "Perfect for deep pantry shelves — you'll see everything at a glance instead of digging behind front-row items.",
          purchaseLink: "https://www.amazon.com/s?k=3+tier+expandable+shelf+riser+pantry",
        },
        {
          name: "Clear Airtight Storage Containers (Set of 10)",
          description:
            "BPA-free, stackable containers with pop-up lids. Great for flour, sugar, pasta, cereal, and snacks.",
          whyItFits:
            "Replaces bulky bags and boxes with uniform, stackable containers that maximize vertical space and keep food fresh longer.",
          purchaseLink: "https://www.amazon.com/s?k=clear+airtight+food+storage+containers+set",
        },
        {
          name: "Lazy Susan Turntable (2-Pack)",
          description:
            "11-inch non-slip turntables for corners and deep shelves. Smooth 360° rotation.",
          whyItFits:
            "Place one on a lower shelf for oils and vinegars, another on an upper shelf for spices — no more reaching or knocking things over.",
          purchaseLink: "https://www.amazon.com/s?k=lazy+susan+turntable+2+pack+kitchen",
        },
        {
          name: "Can Rack Organizer (Holds 36 Cans)",
          description:
            "First-in-first-out gravity-fed can rack. Holds standard 12–16 oz cans in three rows.",
          whyItFits:
            "Eliminates can chaos — you'll always grab the oldest can first and know exactly what needs restocking.",
          purchaseLink: "https://www.amazon.com/s?k=can+rack+organizer+gravity+fed+36+cans",
        },
      ],
    },
    {
      spaceType: "Home Office Desk Area",
      observations:
        "This is a desk workspace with a monitor, keyboard, and scattered papers. Cables are visible and tangled beneath the desk. A few notebooks and pens are piled on one corner, and there's no dedicated charging station.",
      challenges: [
        "Cable clutter under and around the desk",
        "No dedicated spot for notebooks and stationery",
        "Charging cables tangled and competing for outlets",
        "Desktop surface is used as temporary storage instead of workspace",
      ],
      partnerPicks: [],
      recommendations: [
        {
          name: "Under-Desk Cable Management Tray (2-Pack)",
          description:
            "Steel trays that clamp or screw under the desk. Holds power strips and excess cable slack out of sight.",
          whyItFits:
            "Gets the cable mess off the floor and out of view — your desk will instantly look cleaner and be easier to vacuum around.",
          purchaseLink: "https://www.amazon.com/s?k=under+desk+cable+management+tray",
        },
        {
          name: "Desktop Monitor Stand with Drawer",
          description:
            "Raises your monitor 4 inches and provides a built-in sliding drawer for pens, sticky notes, and small supplies.",
          whyItFits:
            "Adds ergonomic height for your screen while giving those scattered desk items a dedicated, easy-to-access drawer.",
          purchaseLink: "https://www.amazon.com/s?k=monitor+stand+with+drawer+desk",
        },
        {
          name: "Charging Station Dock (6-Port)",
          description:
            "One central hub for phones, tablets, watch, and earbuds. Includes short cables and dividers so devices stand upright.",
          whyItFits:
            "Replaces the tangle of individual chargers with a single clean hub — everything charges in one place.",
          purchaseLink: "https://www.amazon.com/s?k=6+port+usb+charging+station+dock",
        },
        {
          name: "Wall-Mounted File Organizer",
          description:
            "Holds 3–5 file folders vertically on the wall. Frees desk space and keeps important papers at eye level.",
          whyItFits:
            "Mounts above or beside the desk to move papers off the work surface entirely, giving you back your desk real estate.",
          purchaseLink: "https://www.amazon.com/s?k=wall+mounted+file+organizer+vertical",
        },
        {
          name: "Desk Pad Protector (36x17 inch)",
          description:
            "Large PU leather desk mat in neutral tones. Dual-sided with a smooth writing surface.",
          whyItFits:
            "Defines the workspace zone visually, protects the desk surface, and makes the whole setup feel more polished.",
          purchaseLink: "https://www.amazon.com/s?k=large+desk+pad+protector+36x17",
        },
      ],
    },
  ];

  // Pick one randomly so repeated scans feel varied
  return mocks[Math.floor(Math.random() * mocks.length)];
}

// ── Real AI analysis (uses OpenAI-compatible vision API) ─────────────
async function realAnalyze(imageBase64: string, mimeType: string): Promise<SpaceAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const prompt = `You are an expert home organization consultant and interior space analyst. 

Analyze the uploaded photo of a person's storage space (closet, cabinet, pantry, room corner, garage, etc.).

Return a JSON object with this exact structure:
{
  "spaceType": "string describing the type of space (e.g., Reach-in Closet, Walk-in Pantry, Garage Shelf)",
  "observations": "A 2-3 sentence objective description of what you see: what's in the space, how it's currently organized, and the general condition.",
  "challenges": ["3-4 specific organization problems you can identify from the image. Be concrete."],
  "recommendations": [
    {
      "name": "Product name — a real product type that exists on the market",
      "description": "One sentence describing the product and its key specs.",
      "whyItFits": "One sentence explaining why this specific product addresses one of the challenges in this specific space.",
      "purchaseLink": "https://www.amazon.com/s?k=URL-encoded+search+terms+for+this+product"
    }
  ]
}

Rules:
- Provide exactly 3 to 5 recommendations, 5 if the space has many issues, 3 if it's mostly fine.
- Every recommendation must have a purchaseLink that is a plausible Amazon search URL (https://www.amazon.com/s?k=...).
- Recommendations should be practical, real-world products that actually exist.
- The challenges should reference visible details from the image.
- Return ONLY the JSON object, no markdown, no code fences, no extra text.

Now analyze the uploaded image.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  return JSON.parse(content) as SpaceAnalysis;
}

// ── PAAPI Enrichment ─────────────────────────────────────────────────
// Enrich recommendations with real Amazon product data when possible.

async function enrichRecommendations(
  recommendations: Recommendation[],
): Promise<Recommendation[]> {
  // Enrich in parallel for speed, but each call falls back gracefully
  const enriched = await Promise.all(
    recommendations.map(async (rec) => {
      try {
        const searchTerms = extractSearchTerms(rec.purchaseLink);
        const result = await searchAmazonProducts(searchTerms);
        if (result.products.length > 0) {
          const product = result.products[0];
          return {
            ...rec,
            amazonProduct: product,
            // Keep original purchaseLink as fallback; UI will prefer amazonProduct
          };
        }
      } catch (err) {
        console.error(`PAAPI enrichment failed for "${rec.name}":`, err);
      }
      return rec; // unchanged if enrichment fails
    }),
  );

  return enriched;
}

// ── Server function ──────────────────────────────────────────────────
// TanStack Start extracts the `data` property from client calls and passes
// it directly to the validator. The handler receives `{ data: validated }`.
export const analyzeSpace = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = input as AnalysisInput;
    if (!d || typeof d.imageBase64 !== "string" || !d.imageBase64) {
      throw new Error("imageBase64 is required");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const { imageBase64, mimeType } = data;
    // Strip data URL prefix if present
    let clean = imageBase64;
    if (clean.includes(",")) {
      clean = clean.split(",")[1];
    }

    const hasApiKey = !!process.env.OPENAI_API_KEY;

    let analysis: SpaceAnalysis;

    if (hasApiKey) {
      try {
        analysis = await realAnalyze(clean, mimeType || "image/jpeg");
      } catch (err) {
        console.error("AI analysis failed, falling back to mock:", err);
        // Fall through to mock on any error
        analysis = mockAnalyze();
      }
    } else {
      // Simulate processing delay for realism
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
      analysis = mockAnalyze();
    }

    // Enrich with real Amazon product data (non-blocking; falls back gracefully)
    analysis.recommendations = await enrichRecommendations(analysis.recommendations);

    // Inject matching partner-listed products
    try {
      analysis.partnerPicks = getMatchingListings(
        analysis.spaceType,
        analysis.challenges,
      );
    } catch (err) {
      console.error("Partner matching failed:", err);
      analysis.partnerPicks = [];
    }

    return analysis;
  });
