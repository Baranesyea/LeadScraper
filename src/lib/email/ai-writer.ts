import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactContext {
  firstName: string;
  lastName: string;
  fullName: string;
  title: string;
  department: string;
  workEmail: string | null;
}

interface CompanyContext {
  name: string;
  industry: string;
  description: string;
  website: string;
  employeeRange: string;
  location: string;
}

interface NewsContext {
  title: string;
  snippet: string;
  url: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

interface AiSettings {
  aiApiKey: string;
  aiProvider: string; // "anthropic" | "openai"
}

// ---------------------------------------------------------------------------
// Settings loader
// ---------------------------------------------------------------------------

async function loadAiSettings(): Promise<AiSettings> {
  const settings = await db.settings.findUnique({ where: { id: "default" } });
  return {
    aiApiKey: settings?.aiApiKey ?? "",
    aiProvider: settings?.aiProvider ?? "anthropic",
  };
}

// ---------------------------------------------------------------------------
// AI provider calls
// ---------------------------------------------------------------------------

/**
 * Call the Anthropic Claude API (Messages endpoint).
 *
 * @see https://docs.anthropic.com/en/api/messages
 */
async function callAnthropic(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  // The Messages API returns content as an array of content blocks.
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text",
  );
  return textBlock?.text ?? "";
}

/**
 * Call the OpenAI Chat Completions API.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 */
async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Route to the correct AI provider based on settings.
 */
async function callAi(
  settings: AiSettings,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (settings.aiProvider === "openai") {
    return callOpenAI(settings.aiApiKey, systemPrompt, userPrompt);
  }
  // Default to Anthropic.
  return callAnthropic(settings.aiApiKey, systemPrompt, userPrompt);
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildPersonalizationPrompt(
  contact: ContactContext,
  company: CompanyContext,
  news: NewsContext | null,
): { system: string; user: string } {
  const system = `You are an expert B2B sales email copywriter. Write highly personalized, conversational cold emails.

Rules:
- Keep the email SHORT: 3-5 sentences maximum.
- Casual but professional tone. No fluff, no jargon.
- Reference something specific about the recipient's company to prove you did your homework.
- If recent company news is provided, weave it in as a conversation starter in the opening line.
- Mention the contact's role/title and suggest how the product could help someone in their position.
- End with a low-friction CTA (quick question, 15-min call, etc.).
- Do NOT include a greeting line like "Dear..." -- start with the first name directly.
- Output ONLY valid JSON with two keys: "subject" and "body". No markdown, no code fences.
- The body should be plain text (no HTML). Use \\n for line breaks.`;

  let userContent = `Write a personalized cold email for:

CONTACT:
  Name: ${contact.fullName}
  Title: ${contact.title || "Unknown"}
  Department: ${contact.department || "Unknown"}

COMPANY:
  Name: ${company.name}
  Industry: ${company.industry || "Unknown"}
  Description: ${company.description || "No description available"}
  Size: ${company.employeeRange || "Unknown"}
  Location: ${company.location || "Unknown"}`;

  if (news) {
    userContent += `

RECENT NEWS:
  Headline: ${news.title}
  Summary: ${news.snippet}`;
  }

  userContent += `

Generate a JSON object with "subject" and "body" keys.`;

  return { system, user: userContent };
}

// ---------------------------------------------------------------------------
// Template-based fallback
// ---------------------------------------------------------------------------

/**
 * Generate a template-based email when no AI API key is configured.
 * Uses the contact and company data to produce a decent personalized email.
 */
function generateTemplateFallback(
  contact: ContactContext,
  company: CompanyContext,
  news: NewsContext | null,
): GeneratedEmail {
  const firstName = contact.firstName || "there";
  const companyName = company.name || "your company";
  const titleMention = contact.title
    ? ` as ${contact.title}`
    : "";

  // Choose an opener based on available data.
  let opener: string;
  if (news) {
    opener = `${firstName}, I saw the news about "${news.title}" -- congratulations to the ${companyName} team!`;
  } else if (company.industry) {
    opener = `${firstName}, I've been following what ${companyName} is doing in ${company.industry} and wanted to reach out.`;
  } else {
    opener = `${firstName}, I came across ${companyName} and was impressed by what you're building.`;
  }

  const body = [
    opener,
    "",
    `Given your role${titleMention}, I thought you might be interested in how we help teams like yours work more efficiently.`,
    "",
    "Would you be open to a quick 15-minute call this week to see if there's a fit?",
    "",
    "Best,",
  ].join("\n");

  const subject = news
    ? `Re: ${companyName}'s recent news`
    : `Quick question for ${firstName}`;

  return { subject, body };
}

// ---------------------------------------------------------------------------
// Follow-up fallback
// ---------------------------------------------------------------------------

function generateFollowUpFallback(
  previousSubject: string,
  contact: ContactContext,
): GeneratedEmail {
  const firstName = contact.firstName || "there";
  const subject = `Re: ${previousSubject}`;
  const body = [
    `${firstName}, just wanted to bump this to the top of your inbox.`,
    "",
    "I know things get busy -- if now isn't the right time, totally understand. Just let me know either way so I can update my notes.",
    "",
    "Thanks!",
  ].join("\n");

  return { subject, body };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a personalized cold email for a contact at a company.
 *
 * - If an AI API key is configured in Settings, calls the AI provider to
 *   produce a highly personalized email referencing recent news and the
 *   contact's role.
 * - If no API key is present, falls back to a well-crafted template approach
 *   using the available merge data.
 *
 * @param contact - Basic contact information.
 * @param company - Company context (name, industry, description, etc.).
 * @param newsOverride - Optionally pass pre-fetched news. If omitted the
 *                       function will try to load the latest CompanyNews from DB.
 */
export async function generatePersonalizedEmail(
  contact: ContactContext,
  company: CompanyContext,
  newsOverride?: NewsContext | null,
): Promise<GeneratedEmail> {
  // Load the latest news if not explicitly provided.
  let news = newsOverride ?? null;
  if (news === undefined || news === null) {
    try {
      // We need a companyId. Look it up by name as a best-effort fallback.
      const dbCompany = await db.company.findFirst({
        where: { name: company.name },
        select: { id: true },
      });
      if (dbCompany) {
        const latestNews = await db.companyNews.findFirst({
          where: { companyId: dbCompany.id },
          orderBy: { createdAt: "desc" },
        });
        if (latestNews) {
          news = {
            title: latestNews.title,
            snippet: latestNews.snippet,
            url: latestNews.url,
          };
        }
      }
    } catch {
      // Non-critical: proceed without news context.
    }
  }

  const settings = await loadAiSettings();

  // If no API key is configured, use the template fallback.
  if (!settings.aiApiKey) {
    console.log("[ai-writer] No AI API key configured. Using template fallback.");
    return generateTemplateFallback(contact, company, news);
  }

  try {
    const { system, user } = buildPersonalizationPrompt(contact, company, news);
    const raw = await callAi(settings, system, user);

    // Parse the JSON response from the AI.
    const parsed = JSON.parse(raw) as GeneratedEmail;
    if (parsed.subject && parsed.body) {
      return parsed;
    }
    throw new Error("AI response missing subject or body");
  } catch (error) {
    console.error("[ai-writer] AI generation failed, using fallback:", error);
    return generateTemplateFallback(contact, company, news);
  }
}

/**
 * Generate a follow-up email based on a previous email.
 *
 * @param previousEmail - The previous Email record (needs at least subject & body).
 * @param contact       - The contact to follow up with.
 */
export async function generateFollowUp(
  previousEmail: { subject: string; body: string },
  contact: ContactContext,
): Promise<GeneratedEmail> {
  const settings = await loadAiSettings();

  if (!settings.aiApiKey) {
    return generateFollowUpFallback(previousEmail.subject, contact);
  }

  try {
    const system = `You are an expert B2B sales email copywriter. Write a short, friendly follow-up email.

Rules:
- 2-3 sentences maximum.
- Reference the previous email naturally.
- Low-pressure tone -- acknowledge they're busy.
- End with a simple yes/no question or easy CTA.
- Output ONLY valid JSON with "subject" and "body" keys. No markdown.
- The body should be plain text. Use \\n for line breaks.`;

    const user = `Write a follow-up email.

PREVIOUS EMAIL:
  Subject: ${previousEmail.subject}
  Body: ${previousEmail.body}

CONTACT:
  Name: ${contact.fullName}
  Title: ${contact.title || "Unknown"}

Generate a JSON object with "subject" and "body" keys.`;

    const raw = await callAi(settings, system, user);
    const parsed = JSON.parse(raw) as GeneratedEmail;
    if (parsed.subject && parsed.body) {
      return parsed;
    }
    throw new Error("AI response missing subject or body");
  } catch (error) {
    console.error("[ai-writer] Follow-up generation failed, using fallback:", error);
    return generateFollowUpFallback(previousEmail.subject, contact);
  }
}

/**
 * Suggest multiple subject line options for a given context.
 *
 * @param context - A freeform description of the email context/goal.
 * @param count   - Number of subject lines to generate (default 5).
 * @returns An array of subject line strings.
 */
export async function suggestSubjectLines(
  context: string,
  count: number = 5,
): Promise<string[]> {
  const settings = await loadAiSettings();

  // Fallback subject lines when no AI key is configured.
  const fallbacks = [
    "Quick question",
    "Thought of you when I saw this",
    "Can I share an idea?",
    "15 minutes this week?",
    "Worth a conversation?",
  ];

  if (!settings.aiApiKey) {
    return fallbacks.slice(0, count);
  }

  try {
    const system = `You are an expert B2B email subject line writer. Generate subject lines that get high open rates.

Rules:
- Short (under 50 characters each).
- Conversational and curiosity-driven.
- No clickbait or ALL CAPS.
- No emojis.
- Output ONLY a valid JSON array of strings. No markdown, no code fences.`;

    const user = `Generate ${count} email subject line options for:

${context}

Return a JSON array of strings.`;

    const raw = await callAi(settings, system, user);
    const parsed = JSON.parse(raw) as string[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, count);
    }
    throw new Error("AI response was not a valid array");
  } catch (error) {
    console.error("[ai-writer] Subject line generation failed:", error);
    return fallbacks.slice(0, count);
  }
}
