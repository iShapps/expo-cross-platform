import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the in-app support assistant for iShapps, a mobile app used by healthcare professionals (HCPs) on the SmartHealth staffing platform to find and manage shifts, upload compliance documents, and manage their profile.

Answer questions about iShapps and SmartHealth: how the platform works, shift booking, compliance documents, payments, and general healthcare-staffing questions relevant to the app.

Rules:
- Do not give medical advice, clinical guidance, or diagnoses.
- Do not invent specific account details, shift data, payment amounts, or document statuses you were not given — you have no access to the user's account.
- If a question needs access to the user's account/data, or you are not confident in the answer, say so plainly and suggest contacting human support.
- Keep answers short and conversational — 2 to 4 sentences, no headers or bullet lists unless truly needed.
- If asked something entirely unrelated to iShapps, SmartHealth, or healthcare staffing, politely redirect to what you can help with.`;

type ChatTurn = { role?: string; text?: string };

// Cheap abuse guard: this route spends real Anthropic credits per call, so it
// must not be callable by anyone who isn't a signed-in app user. Re-validates
// the caller's existing SmartHealth bearer token against the app's own
// authenticated "me" endpoint rather than duplicating any backend logic here.
async function isAuthorized(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!authHeader || !apiBaseUrl) return false;

  try {
    const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/v2/auth/me`, {
      headers: { Authorization: authHeader },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // Cheapest check first — no point authorizing a call that can't go anywhere.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        status: false,
        code: "not_configured",
        message: "Assistant is not configured.",
        data: null,
      },
      { status: 503 },
    );
  }

  if (!(await isAuthorized(request))) {
    return Response.json(
      { status: false, message: "Unauthorized.", data: null },
      { status: 401 },
    );
  }

  let body: { message?: string; history?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { status: false, message: "Invalid request body.", data: null },
      { status: 400 },
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json(
      { status: false, message: "message is required.", data: null },
      { status: 400 },
    );
  }

  const history = Array.isArray(body.history) ? body.history.slice(-20) : [];
  const messages: Anthropic.MessageParam[] = history
    .filter(
      (turn): turn is Required<ChatTurn> =>
        !!turn && typeof turn.text === "string" && turn.text.trim().length > 0,
    )
    .map((turn) => ({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: turn.text,
    }));
  messages.push({ role: "user", content: message });

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { effort: "low" },
      messages,
    });

    if (response.stop_reason === "refusal") {
      return Response.json({
        status: true,
        data: {
          reply:
            "I'm not able to help with that. Would you like me to connect you with human support instead?",
        },
      });
    }

    const reply = response.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text",
      )
      .map((block) => block.text)
      .join("");

    if (!reply) {
      return Response.json(
        {
          status: false,
          message: "The assistant could not generate a response.",
          data: null,
        },
        { status: 502 },
      );
    }

    return Response.json({ status: true, data: { reply } });
  } catch (err) {
    console.error("[assistant/ask] Claude request failed", err);
    return Response.json(
      {
        status: false,
        message: "The assistant is temporarily unavailable. Please try again.",
        data: null,
      },
      { status: 502 },
    );
  }
}
