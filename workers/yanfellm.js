// Paste this into a Cloudflare Worker (Workers & Pages → Create → Edit code).
// Do not put your API key in this file. Add it as a Worker secret instead.

var SYSTEM = [
  "You are YanfeLLM, a short first-person AI assistant embedded in Yanfe's design portfolio site.",
  "Answer AS Yanfe, in first person, in 2-4 friendly sentences. No markdown headers.",
  "Facts about Yanfe (use only these; if asked something not covered, say you don't have that detail on the site):",
  "- Senior Product Designer at adidas, on the post-sales team (self-service, order management, lower-funnel e-commerce).",
  "- 7+ years across e-commerce, logistics and complex service products.",
  "- Previously at Mercadona Tech, Parclick, and Syneidis.",
  "- Holds a BFA in architecture, which shapes how she thinks about information architecture in product work.",
  "- Selected projects: Rethinking adidas post-purchase support, Repeat Order: turning a hidden shortcut into a growth lever (Mercadona Online, 2021), Order Detail Page as a system (adidas design system), \"Where is my refund?\" conversational timeline (adidas customer service), a post-sales design system refactor, adiRun: Designing an AI agent for the adidas Running App, and a React/TypeScript design system built from scratch in Storybook.",
  "- Also builds small AI experiments to learn: a WCAG contrast checker (MCP app in Cursor), a token-based React button component, and browser-based interactive exercises."
].join("\n");

function corsHeaders(origin) {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400"
  };
}

function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  var allowed = (env.ALLOWED_ORIGIN || "").replace(/\/$/, "");
  if (allowed && origin.replace(/\/$/, "") === allowed) return true;
  if (/^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin)) return true;
  if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin)) return true;
  return false;
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({ "content-type": "application/json" }, corsHeaders(origin))
  });
}

export default {
  async fetch(request, env) {
    var origin = request.headers.get("Origin") || "";
    if (!isAllowedOrigin(origin, env)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Missing ANTHROPIC_API_KEY secret" }, 500, origin);
    }

    var payload;
    try {
      payload = await request.json();
    } catch (e) {
      return json({ error: "Invalid JSON" }, 400, origin);
    }

    var question = String((payload && payload.question) || "").trim();
    if (!question) return json({ error: "Missing question" }, 400, origin);
    if (question.length > 500) question = question.slice(0, 500);

    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: "user", content: question }]
      })
    });

    var data = await r.json();
    if (!r.ok) {
      return json({ error: "Model request failed" }, 502, origin);
    }

    var text = "";
    if (data.content && data.content[0] && data.content[0].text) {
      text = data.content[0].text;
    }
    return json({ text: text }, 200, origin);
  }
};
