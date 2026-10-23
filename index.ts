// URL reputation lookup edge function.
// Calls Google Safe Browsing when SAFE_BROWSING_API_KEY is configured as a
// Supabase secret. Returns an honest "not configured" error when the key is
// absent — never fakes a response.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SafeBrowsingThreatMatch {
  threatType: string;
  platformType: string;
  threatEntryType: string;
  threat: { url: string };
  threatEntryMetadata?: { entries: { key: string; value: string }[] };
  cacheDuration: string;
}

interface SafeBrowsingResponse {
  matches?: SafeBrowsingThreatMatch[];
}

interface ReputationVerdict {
  reputation: "safe" | "unsafe" | "unrated";
  threatTypes: string[];
  summary: string;
  details: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number, code: string): Response {
  return jsonResponse({ error: message, code }, status);
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const apiKey = Deno.env.get("SAFE_BROWSING_API_KEY");
  if (!apiKey) {
    return errorResponse(
      "URL reputation lookup is not configured. Add a SAFE_BROWSING_API_KEY secret to enable it.",
      503,
      "not_configured",
    );
  }

  try {
    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return errorResponse("Missing 'url' in request body.", 400, "missing_url");
    }
    if (rawUrl.length > 2000) {
      return errorResponse(
        `URL too long (${rawUrl.length} chars). Maximum is 2000.`,
        400,
        "url_too_long",
      );
    }

    const url = normalizeUrl(rawUrl);

    const sbRes = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "ai-guardian",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );

    if (!sbRes.ok) {
      const errText = await sbRes.text();
      console.error("Safe Browsing API error:", sbRes.status, errText);
      return errorResponse(
        "The reputation service returned an error. Please try again.",
        502,
        "reputation_service_error",
      );
    }

    const sbData = (await sbRes.json()) as SafeBrowsingResponse;
    const matches = sbData.matches ?? [];

    const verdict: ReputationVerdict =
      matches.length > 0
        ? {
            reputation: "unsafe",
            threatTypes: matches.map((m) => m.threatType),
            summary: `Google Safe Browsing flagged this URL as: ${matches
              .map((m) => m.threatType.replace(/_/g, " ").toLowerCase())
              .join(", ")}.`,
            details:
              "This URL appears on Google's blocklist. Do not visit it, click links from it, or enter any information.",
          }
        : {
            reputation: "safe",
            threatTypes: [],
            summary:
              "Google Safe Browsing found no threats for this URL. This means it is not on known malware or phishing blocklists — but it does not guarantee the site is safe.",
            details:
              "Safe Browsing checks against known threat lists. A clean result does not cover brand-new phishing sites, scam content, or other risks not yet flagged by Google.",
          };

    return jsonResponse({ verdict, source: "google_safe_browsing" });
  } catch (err) {
    console.error("Edge function error:", err);
    return errorResponse(
      "An unexpected error occurred during reputation lookup.",
      500,
      "internal_error",
    );
  }
});
