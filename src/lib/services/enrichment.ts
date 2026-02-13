// ============================================================================
// Lead Enrichment Service
// 4-layer enrichment: Google Business, Website, Social, Signals & Hooks
// All layers are stubs returning simulated data based on input
// ============================================================================

interface EnrichmentResult {
  // Google Business
  googleRating: number | null;
  googleReviewCount: number | null;
  recentReviews: Array<{ text: string; rating: number; date: string }>;
  reviewSentiment: string | null;
  hoursUpdated: boolean | null;
  hasPhotos: boolean | null;
  googleCategory: string | null;
  googleLocation: string | null;
  // Website
  hasWebsite: boolean;
  crmDetected: string | null; // none, basic, full
  crmName: string | null;
  websiteQuality: number | null;
  hasSsl: boolean;
  hasIdx: boolean;
  siteAge: string | null;
  techStack: string[];
  // Social
  fbPageUrl: string | null;
  fbFollowers: number | null;
  fbPostFrequency: string | null;
  igFollowers: number | null;
  igPostFrequency: string | null;
  ytHasChannel: boolean;
  ytVideoCount: number | null;
  linkedinHeadline: string | null;
  linkedinConnections: number | null;
  // Signals & Hooks
  signals: Array<{
    type: string;
    description: string;
    severity: string;
    source: string;
  }>;
  hooks: Array<{ text: string; signal: string; sourceUrl: string }>;
  leadPriority: string; // HIGH, MEDIUM, LOW
}

interface ContactInput {
  name: string;
  email?: string;
  company?: string;
  website?: string;
  location?: string;
}

// ---------------------------------------------------------------------------
// Seeded Random Number Generator
// Produces deterministic results based on a string seed
// ---------------------------------------------------------------------------

class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    this.seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      const char = seedStr.charCodeAt(i);
      this.seed = (this.seed << 5) - this.seed + char;
      this.seed = this.seed & this.seed;
    }
    this.seed = Math.abs(this.seed) || 1;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns a float rounded to one decimal in [min, max] */
  nextFloat(min: number, max: number, decimals: number = 1): number {
    const value = this.next() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  /** Weighted random selection: returns the index */
  weightedChoice(weights: number[]): number {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
}

// ---------------------------------------------------------------------------
// Simulated Review Templates
// ---------------------------------------------------------------------------

const POSITIVE_REVIEWS = [
  "Fantastic experience working with this agent. Very professional and responsive.",
  "Helped us find our dream home in record time. Highly recommended!",
  "Excellent communication throughout the entire process. Would use again.",
  "Went above and beyond to ensure we were happy with every detail.",
  "The most professional real estate experience we've had. Five stars!",
  "Always available to answer questions. Made the process stress-free.",
  "Really knows the local market. Got us a great deal.",
  "Patient, knowledgeable, and truly cares about their clients.",
];

const NEUTRAL_REVIEWS = [
  "Decent experience overall. Communication could be better.",
  "Got the job done but took longer than expected.",
  "Okay service. Nothing outstanding but no major issues either.",
  "Average experience. Would consider other options next time.",
];

const NEGATIVE_REVIEWS = [
  "Slow to respond to emails and calls. Frustrating experience.",
  "Did not seem very knowledgeable about the area we were looking in.",
  "Felt pushed to make decisions too quickly.",
  "Listed price was far from final closing price. Disappointing.",
];

const CRM_NAMES: Record<string, string[]> = {
  none: [],
  basic: ["Contactually", "LionDesk", "Wise Agent", "RealtyJuggler"],
  full: [
    "Follow Up Boss",
    "kvCORE",
    "BoomTown",
    "Sierra Interactive",
    "Real Geeks",
    "Chime",
  ],
};

const TECH_STACKS = [
  ["WordPress", "Jeeves Theme", "IDX Broker"],
  ["Squarespace", "Custom CSS"],
  ["Wix", "Wix Real Estate"],
  ["WordPress", "Jeeves Theme", "Showcase IDX", "Elementor"],
  ["Custom HTML/CSS", "jQuery"],
  ["WordPress", "AgentPress Pro", "IDX Broker", "Yoast SEO"],
  ["Webflow", "Custom JS"],
  ["GoDaddy Website Builder"],
  ["WordPress", "Jeeves Theme", "iHomefinder", "WPBakery"],
];

const GOOGLE_CATEGORIES = [
  "Real estate agent",
  "Real estate agency",
  "Real estate consultant",
  "Property management company",
  "Real estate broker",
  "Real estate appraiser",
];

const LINKEDIN_HEADLINES = [
  "Real Estate Professional | Helping Families Find Their Dream Home",
  "Licensed Realtor | Residential & Commercial Properties",
  "Top Producing Agent | Luxury Home Specialist",
  "Real Estate Advisor | First-Time Buyer Expert",
  "Broker Associate | Investment Property Specialist",
  "Realtor | Relocation Specialist | Certified Negotiation Expert",
  "Real Estate Agent | New Construction & Resale",
  "Senior Real Estate Specialist | 10+ Years Experience",
];

const FB_POST_FREQUENCIES = ["daily", "2-3x/week", "weekly", "bi-weekly", "monthly", "rarely"];
const IG_POST_FREQUENCIES = ["daily", "3-4x/week", "weekly", "bi-weekly", "monthly", "rarely"];

// ---------------------------------------------------------------------------
// Layer 1: Google Business Enrichment (stub)
// ---------------------------------------------------------------------------

function enrichGoogleBusiness(
  contact: ContactInput,
  rng: SeededRandom
): {
  googleRating: number | null;
  googleReviewCount: number | null;
  recentReviews: Array<{ text: string; rating: number; date: string }>;
  reviewSentiment: string | null;
  hoursUpdated: boolean | null;
  hasPhotos: boolean | null;
  googleCategory: string | null;
  googleLocation: string | null;
} {
  const rating = rng.nextFloat(3.5, 5.0, 1);
  const reviewCount = rng.nextInt(5, 500);

  // Generate 1-3 recent reviews
  const reviewCountToGenerate = rng.nextInt(1, 3);
  const recentReviews: Array<{ text: string; rating: number; date: string }> =
    [];

  for (let i = 0; i < reviewCountToGenerate; i++) {
    const reviewRating = rng.nextInt(3, 5);
    let reviewText: string;

    if (reviewRating >= 4) {
      reviewText = rng.pick(POSITIVE_REVIEWS);
    } else if (reviewRating === 3) {
      reviewText = rng.pick(NEUTRAL_REVIEWS);
    } else {
      reviewText = rng.pick(NEGATIVE_REVIEWS);
    }

    // Generate a date within the last 6 months
    const daysAgo = rng.nextInt(1, 180);
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - daysAgo);
    const dateStr = reviewDate.toISOString().split("T")[0];

    recentReviews.push({
      text: reviewText,
      rating: reviewRating,
      date: dateStr,
    });
  }

  // Determine sentiment based on rating
  let reviewSentiment: string;
  if (rating >= 4.5) {
    reviewSentiment = "very_positive";
  } else if (rating >= 4.0) {
    reviewSentiment = "positive";
  } else if (rating >= 3.5) {
    reviewSentiment = "mixed";
  } else {
    reviewSentiment = "negative";
  }

  return {
    googleRating: rating,
    googleReviewCount: reviewCount,
    recentReviews,
    reviewSentiment,
    hoursUpdated: rng.next() > 0.3,
    hasPhotos: rng.next() > 0.2,
    googleCategory: rng.pick(GOOGLE_CATEGORIES),
    googleLocation: contact.location || null,
  };
}

// ---------------------------------------------------------------------------
// Layer 2: Website Enrichment (stub)
// ---------------------------------------------------------------------------

function enrichWebsite(
  contact: ContactInput,
  rng: SeededRandom
): {
  hasWebsite: boolean;
  crmDetected: string | null;
  crmName: string | null;
  websiteQuality: number | null;
  hasSsl: boolean;
  hasIdx: boolean;
  siteAge: string | null;
  techStack: string[];
} {
  const hasWebsite = !!contact.website;

  if (!hasWebsite) {
    return {
      hasWebsite: false,
      crmDetected: null,
      crmName: null,
      websiteQuality: null,
      hasSsl: false,
      hasIdx: false,
      siteAge: null,
      techStack: [],
    };
  }

  // CRM detection: 60% none, 25% basic, 15% full
  const crmIdx = rng.weightedChoice([60, 25, 15]);
  const crmLevels: Array<string> = ["none", "basic", "full"];
  const crmDetected = crmLevels[crmIdx];

  let crmName: string | null = null;
  if (crmDetected !== "none") {
    const crmOptions = CRM_NAMES[crmDetected];
    if (crmOptions && crmOptions.length > 0) {
      crmName = rng.pick(crmOptions);
    }
  }

  // Website quality (0-100)
  let baseQuality: number;
  if (crmDetected === "full") {
    baseQuality = rng.nextInt(60, 95);
  } else if (crmDetected === "basic") {
    baseQuality = rng.nextInt(40, 75);
  } else {
    baseQuality = rng.nextInt(20, 65);
  }

  const hasSsl = rng.next() > 0.15; // 85% chance of SSL
  const hasIdx = crmDetected !== "none" || rng.next() > 0.6;

  // Site age
  const years = rng.nextInt(1, 15);
  const siteAge = `${years} year${years > 1 ? "s" : ""}`;

  // Tech stack
  const techStack = rng.pick(TECH_STACKS);

  return {
    hasWebsite: true,
    crmDetected,
    crmName,
    websiteQuality: baseQuality,
    hasSsl,
    hasIdx,
    siteAge,
    techStack,
  };
}

// ---------------------------------------------------------------------------
// Layer 3: Social Media Enrichment (stub)
// ---------------------------------------------------------------------------

function enrichSocial(
  contact: ContactInput,
  rng: SeededRandom
): {
  fbPageUrl: string | null;
  fbFollowers: number | null;
  fbPostFrequency: string | null;
  igFollowers: number | null;
  igPostFrequency: string | null;
  ytHasChannel: boolean;
  ytVideoCount: number | null;
  linkedinHeadline: string | null;
  linkedinConnections: number | null;
} {
  // ~70% chance of having a Facebook page
  const hasFb = rng.next() > 0.3;
  const fbPageUrl = hasFb
    ? `https://facebook.com/${(contact.name || "agent").toLowerCase().replace(/\s+/g, "")}`
    : null;
  const fbFollowers = hasFb ? rng.nextInt(50, 5000) : null;
  const fbPostFrequency = hasFb ? rng.pick(FB_POST_FREQUENCIES) : null;

  // ~50% chance of having Instagram
  const hasIg = rng.next() > 0.5;
  const igFollowers = hasIg ? rng.nextInt(100, 15000) : null;
  const igPostFrequency = hasIg ? rng.pick(IG_POST_FREQUENCIES) : null;

  // ~20% chance of having YouTube
  const ytHasChannel = rng.next() > 0.8;
  const ytVideoCount = ytHasChannel ? rng.nextInt(3, 100) : null;

  // ~80% chance of having LinkedIn
  const hasLinkedin = rng.next() > 0.2;
  const linkedinHeadline = hasLinkedin ? rng.pick(LINKEDIN_HEADLINES) : null;
  const linkedinConnections = hasLinkedin ? rng.nextInt(50, 2000) : null;

  return {
    fbPageUrl,
    fbFollowers,
    fbPostFrequency,
    igFollowers,
    igPostFrequency,
    ytHasChannel,
    ytVideoCount,
    linkedinHeadline,
    linkedinConnections,
  };
}

// ---------------------------------------------------------------------------
// Layer 4: Signals & Hooks Generation (stub)
// ---------------------------------------------------------------------------

function generateSignalsAndHooks(
  contact: ContactInput,
  google: ReturnType<typeof enrichGoogleBusiness>,
  website: ReturnType<typeof enrichWebsite>,
  social: ReturnType<typeof enrichSocial>,
  rng: SeededRandom
): {
  signals: Array<{
    type: string;
    description: string;
    severity: string;
    source: string;
  }>;
  hooks: Array<{ text: string; signal: string; sourceUrl: string }>;
  leadPriority: string;
} {
  const signals: Array<{
    type: string;
    description: string;
    severity: string;
    source: string;
  }> = [];

  const hooks: Array<{ text: string; signal: string; sourceUrl: string }> = [];

  // Signal: No CRM detected
  if (website.crmDetected === "none" && website.hasWebsite) {
    signals.push({
      type: "no_crm",
      description:
        "No CRM or lead management system detected on their website",
      severity: "high",
      source: "website_analysis",
    });
    hooks.push({
      text: `I noticed ${contact.name || "your"} website doesn't seem to have a lead capture system in place. You could be missing out on converting visitors into clients.`,
      signal: "no_crm",
      sourceUrl: contact.website || "",
    });
  }

  // Signal: Basic CRM (upgrade opportunity)
  if (website.crmDetected === "basic") {
    signals.push({
      type: "basic_crm",
      description: `Using a basic CRM (${website.crmName}). Potential upgrade opportunity.`,
      severity: "medium",
      source: "website_analysis",
    });
    hooks.push({
      text: `I see you're using ${website.crmName} - have you been finding it limiting as your business grows? Many agents at your level are upgrading to more full-featured platforms.`,
      signal: "basic_crm",
      sourceUrl: contact.website || "",
    });
  }

  // Signal: Low Google rating
  if (google.googleRating !== null && google.googleRating < 4.0) {
    signals.push({
      type: "low_rating",
      description: `Google rating is ${google.googleRating}/5 - below average for top agents`,
      severity: "medium",
      source: "google_business",
    });
    hooks.push({
      text: `I noticed your Google rating is ${google.googleRating} - I have some strategies that could help improve your online reputation and attract more clients.`,
      signal: "low_rating",
      sourceUrl: `https://google.com/maps`,
    });
  }

  // Signal: Few reviews
  if (
    google.googleReviewCount !== null &&
    google.googleReviewCount < 20
  ) {
    signals.push({
      type: "few_reviews",
      description: `Only ${google.googleReviewCount} Google reviews. Below competitive threshold.`,
      severity: "medium",
      source: "google_business",
    });
  }

  // Signal: No website
  if (!website.hasWebsite) {
    signals.push({
      type: "no_website",
      description: "No website detected. Major gap in online presence.",
      severity: "high",
      source: "website_analysis",
    });
    hooks.push({
      text: `It looks like you don't have a dedicated website yet. In today's market, ${google.googleReviewCount || "many"} of your potential clients are searching online first - having a professional site could significantly boost your lead generation.`,
      signal: "no_website",
      sourceUrl: "",
    });
  }

  // Signal: No SSL
  if (website.hasWebsite && !website.hasSsl) {
    signals.push({
      type: "no_ssl",
      description:
        "Website lacks SSL certificate. May deter potential clients.",
      severity: "high",
      source: "website_analysis",
    });
  }

  // Signal: Low social presence
  if (!social.fbPageUrl && social.igFollowers === null) {
    signals.push({
      type: "low_social",
      description:
        "Minimal social media presence detected. Missing engagement opportunities.",
      severity: "medium",
      source: "social_analysis",
    });
    hooks.push({
      text: `I couldn't find an active social media presence for your business. Agents who post consistently on social media see 2-3x more inbound leads on average.`,
      signal: "low_social",
      sourceUrl: "",
    });
  }

  // Signal: Low website quality
  if (
    website.websiteQuality !== null &&
    website.websiteQuality < 40
  ) {
    signals.push({
      type: "low_website_quality",
      description: `Website quality score is ${website.websiteQuality}/100 - needs improvement`,
      severity: "medium",
      source: "website_analysis",
    });
  }

  // Ensure we have at least 1 signal
  if (signals.length === 0) {
    signals.push({
      type: "growth_opportunity",
      description:
        "Agent has a solid foundation. Opportunity for optimization and growth.",
      severity: "low",
      source: "general_analysis",
    });
    hooks.push({
      text: `Your online presence is solid, but I've identified some areas where targeted improvements could help you stand out even more in your market.`,
      signal: "growth_opportunity",
      sourceUrl: "",
    });
  }

  // Ensure we have at least 2 hooks
  if (hooks.length < 2) {
    hooks.push({
      text: `With ${google.googleReviewCount || "your"} reviews and your current market position, there's a real opportunity to level up your lead generation strategy.`,
      signal: "general",
      sourceUrl: "",
    });
  }

  // Determine lead priority based on CRM detection
  let leadPriority: string;
  if (website.crmDetected === "none" || website.crmDetected === null) {
    leadPriority = "HIGH";
  } else if (website.crmDetected === "basic") {
    leadPriority = "MEDIUM";
  } else {
    leadPriority = "LOW";
  }

  return { signals, hooks, leadPriority };
}

// ---------------------------------------------------------------------------
// Main Enrichment Function
// ---------------------------------------------------------------------------

function enrichContact(contact: ContactInput): EnrichmentResult {
  // Create a seeded RNG from the contact name for deterministic results
  const seed = (contact.name || "") + (contact.email || "") + (contact.company || "");
  const rng = new SeededRandom(seed);

  // Layer 1: Google Business
  const google = enrichGoogleBusiness(contact, rng);

  // Layer 2: Website
  const website = enrichWebsite(contact, rng);

  // Layer 3: Social
  const social = enrichSocial(contact, rng);

  // Layer 4: Signals & Hooks
  const { signals, hooks, leadPriority } = generateSignalsAndHooks(
    contact,
    google,
    website,
    social,
    rng
  );

  return {
    // Google Business
    googleRating: google.googleRating,
    googleReviewCount: google.googleReviewCount,
    recentReviews: google.recentReviews,
    reviewSentiment: google.reviewSentiment,
    hoursUpdated: google.hoursUpdated,
    hasPhotos: google.hasPhotos,
    googleCategory: google.googleCategory,
    googleLocation: google.googleLocation,
    // Website
    hasWebsite: website.hasWebsite,
    crmDetected: website.crmDetected,
    crmName: website.crmName,
    websiteQuality: website.websiteQuality,
    hasSsl: website.hasSsl,
    hasIdx: website.hasIdx,
    siteAge: website.siteAge,
    techStack: website.techStack,
    // Social
    fbPageUrl: social.fbPageUrl,
    fbFollowers: social.fbFollowers,
    fbPostFrequency: social.fbPostFrequency,
    igFollowers: social.igFollowers,
    igPostFrequency: social.igPostFrequency,
    ytHasChannel: social.ytHasChannel,
    ytVideoCount: social.ytVideoCount,
    linkedinHeadline: social.linkedinHeadline,
    linkedinConnections: social.linkedinConnections,
    // Signals & Hooks
    signals,
    hooks,
    leadPriority,
  };
}

export { enrichContact, type EnrichmentResult };
