// ============================================================================
// Email Validation Service
// 4-layer validation pipeline: Syntax -> DNS/MX -> SMTP -> Cross-reference
// ============================================================================

const DISPOSABLE_DOMAINS: string[] = [
  "guerrillamail.com",
  "tempmail.com",
  "yopmail.com",
  "mailinator.com",
  "throwaway.email",
  "guerrillamail.info",
  "grr.la",
  "guerrillamail.net",
  "sharklasers.com",
  "guerrillamail.de",
  "tmail.com",
  "trashmail.com",
];

const ROLE_BASED_PREFIXES: string[] = [
  "info",
  "admin",
  "sales",
  "office",
  "support",
  "contact",
  "help",
  "billing",
  "marketing",
  "hr",
  "webmaster",
  "postmaster",
  "noreply",
  "no-reply",
];

const KNOWN_GOOD_DOMAINS: string[] = [
  "gmail.com",
  "outlook.com",
  "yahoo.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "fastmail.com",
  "live.com",
  "msn.com",
  "me.com",
  "mac.com",
  "mail.com",
  "yandex.com",
];

interface ValidationResult {
  syntaxValid: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  dnsValid: boolean;
  mxExists: boolean;
  isCatchAll: boolean;
  smtpValid: boolean | null;
  smtpResponse: string | null;
  provider1Name: string | null;
  provider1Result: string | null;
  provider2Name: string | null;
  provider2Result: string | null;
  confidence: number; // 0-100
  status: "pass" | "risky" | "fail";
}

// ---------------------------------------------------------------------------
// Layer 1: Syntax Validation (real implementation)
// ---------------------------------------------------------------------------

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function checkSyntax(email: string): {
  syntaxValid: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  tldValid: boolean;
} {
  const trimmed = email.trim().toLowerCase();

  // Basic regex check
  const syntaxValid = EMAIL_REGEX.test(trimmed);

  if (!syntaxValid) {
    return {
      syntaxValid: false,
      isDisposable: false,
      isRoleBased: false,
      tldValid: false,
    };
  }

  const [localPart, domain] = trimmed.split("@");

  // Check disposable domains
  const isDisposable = DISPOSABLE_DOMAINS.includes(domain);

  // Check role-based prefixes
  const localLower = localPart.toLowerCase();
  const isRoleBased = ROLE_BASED_PREFIXES.some(
    (prefix) => localLower === prefix || localLower.startsWith(prefix + ".")
  );

  // Check TLD validity
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  const tldValid =
    tld !== undefined &&
    tld.length >= 2 &&
    tld.length <= 20 &&
    /^[a-zA-Z]{2,}$/.test(tld);

  return { syntaxValid, isDisposable, isRoleBased, tldValid };
}

// ---------------------------------------------------------------------------
// Layer 2: DNS/MX Check (stub - simulated)
// ---------------------------------------------------------------------------

function checkDnsMx(domain: string): {
  dnsValid: boolean;
  mxExists: boolean;
  isCatchAll: boolean;
} {
  const lowerDomain = domain.toLowerCase();

  // Known good domains always pass
  if (KNOWN_GOOD_DOMAINS.includes(lowerDomain)) {
    return { dnsValid: true, mxExists: true, isCatchAll: false };
  }

  // Simulate DNS check based on domain characteristics
  // Domains with common TLDs are likely valid
  const commonTlds = [".com", ".org", ".net", ".io", ".co", ".us", ".edu"];
  const hasCommonTld = commonTlds.some((tld) => lowerDomain.endsWith(tld));

  if (hasCommonTld) {
    return { dnsValid: true, mxExists: true, isCatchAll: false };
  }

  // Less common TLDs - still valid DNS but may not have MX
  return { dnsValid: true, mxExists: true, isCatchAll: false };
}

// ---------------------------------------------------------------------------
// Layer 3: SMTP Verification (stub - simulated)
// ---------------------------------------------------------------------------

function checkSmtp(
  email: string,
  domain: string
): { smtpValid: boolean | null; smtpResponse: string | null } {
  const lowerDomain = domain.toLowerCase();

  // Known providers return definitive results
  if (KNOWN_GOOD_DOMAINS.includes(lowerDomain)) {
    return {
      smtpValid: true,
      smtpResponse: "250 OK - Mailbox exists",
    };
  }

  // For corporate/custom domains, SMTP is often inconclusive
  // (many servers don't respond to VRFY or reject all during checks)
  const hash = simpleHash(email);
  if (hash % 3 === 0) {
    return {
      smtpValid: true,
      smtpResponse: "250 OK - Accepted",
    };
  } else if (hash % 3 === 1) {
    return {
      smtpValid: null,
      smtpResponse: "Greylisting detected - inconclusive",
    };
  } else {
    return {
      smtpValid: null,
      smtpResponse: "Server did not respond to RCPT TO - inconclusive",
    };
  }
}

// ---------------------------------------------------------------------------
// Layer 4: Cross-Reference Verification (stub - simulated)
// ---------------------------------------------------------------------------

function crossReference(
  email: string,
  domain: string
): {
  provider1Name: string | null;
  provider1Result: string | null;
  provider2Name: string | null;
  provider2Result: string | null;
} {
  const lowerDomain = domain.toLowerCase();

  // Known providers always return deliverable
  if (KNOWN_GOOD_DOMAINS.includes(lowerDomain)) {
    return {
      provider1Name: "ZeroBounce",
      provider1Result: "deliverable",
      provider2Name: "NeverBounce",
      provider2Result: "valid",
    };
  }

  // For other domains, simulate cross-reference results
  const hash = simpleHash(email);
  const results: Array<{
    provider1Result: string;
    provider2Result: string;
  }> = [
    { provider1Result: "deliverable", provider2Result: "valid" },
    { provider1Result: "deliverable", provider2Result: "unknown" },
    { provider1Result: "unknown", provider2Result: "accept_all" },
    { provider1Result: "risky", provider2Result: "unknown" },
  ];

  const idx = hash % results.length;
  const result = results[idx];

  return {
    provider1Name: "ZeroBounce",
    provider1Result: result.provider1Result,
    provider2Name: "NeverBounce",
    provider2Result: result.provider2Result,
  };
}

// ---------------------------------------------------------------------------
// Confidence Calculation
// ---------------------------------------------------------------------------

function calculateConfidence(params: {
  syntaxValid: boolean;
  tldValid: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
  dnsValid: boolean;
  mxExists: boolean;
  smtpValid: boolean | null;
  provider1Result: string | null;
  provider2Result: string | null;
}): number {
  let confidence = 0;

  // Syntax (base 20 points)
  if (params.syntaxValid && params.tldValid) {
    confidence += 20;
  } else {
    return 0; // Invalid syntax means 0 confidence
  }

  // Disposable penalty
  if (params.isDisposable) {
    confidence -= 10;
  }

  // Role-based penalty (not as severe)
  if (params.isRoleBased) {
    confidence -= 5;
  }

  // DNS/MX (25 points)
  if (params.dnsValid) {
    confidence += 10;
  }
  if (params.mxExists) {
    confidence += 15;
  }

  // SMTP (25 points)
  if (params.smtpValid === true) {
    confidence += 25;
  } else if (params.smtpValid === null) {
    confidence += 10; // Inconclusive gets partial credit
  }

  // Cross-reference (30 points)
  if (
    params.provider1Result === "deliverable" ||
    params.provider1Result === "valid"
  ) {
    confidence += 15;
  } else if (params.provider1Result === "risky") {
    confidence += 5;
  }

  if (
    params.provider2Result === "deliverable" ||
    params.provider2Result === "valid"
  ) {
    confidence += 15;
  } else if (
    params.provider2Result === "unknown" ||
    params.provider2Result === "accept_all"
  ) {
    confidence += 5;
  }

  return Math.max(0, Math.min(100, confidence));
}

function determineStatus(
  confidence: number,
  isDisposable: boolean
): "pass" | "risky" | "fail" {
  if (isDisposable) {
    return "fail";
  }
  if (confidence >= 70) {
    return "pass";
  }
  if (confidence >= 40) {
    return "risky";
  }
  return "fail";
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Main Validation Function
// ---------------------------------------------------------------------------

function validateEmail(email: string): ValidationResult {
  const trimmedEmail = email.trim().toLowerCase();

  // Layer 1: Syntax
  const syntax = checkSyntax(trimmedEmail);

  if (!syntax.syntaxValid) {
    return {
      syntaxValid: false,
      isDisposable: false,
      isRoleBased: false,
      dnsValid: false,
      mxExists: false,
      isCatchAll: false,
      smtpValid: null,
      smtpResponse: null,
      provider1Name: null,
      provider1Result: null,
      provider2Name: null,
      provider2Result: null,
      confidence: 0,
      status: "fail",
    };
  }

  const [, domain] = trimmedEmail.split("@");

  // Layer 2: DNS/MX
  const dns = checkDnsMx(domain);

  // Layer 3: SMTP
  const smtp = checkSmtp(trimmedEmail, domain);

  // Layer 4: Cross-reference
  const xref = crossReference(trimmedEmail, domain);

  // Calculate confidence
  const confidence = calculateConfidence({
    syntaxValid: syntax.syntaxValid,
    tldValid: syntax.tldValid,
    isDisposable: syntax.isDisposable,
    isRoleBased: syntax.isRoleBased,
    dnsValid: dns.dnsValid,
    mxExists: dns.mxExists,
    smtpValid: smtp.smtpValid,
    provider1Result: xref.provider1Result,
    provider2Result: xref.provider2Result,
  });

  const status = determineStatus(confidence, syntax.isDisposable);

  return {
    syntaxValid: syntax.syntaxValid,
    isDisposable: syntax.isDisposable,
    isRoleBased: syntax.isRoleBased,
    dnsValid: dns.dnsValid,
    mxExists: dns.mxExists,
    isCatchAll: dns.isCatchAll,
    smtpValid: smtp.smtpValid,
    smtpResponse: smtp.smtpResponse,
    provider1Name: xref.provider1Name,
    provider1Result: xref.provider1Result,
    provider2Name: xref.provider2Name,
    provider2Result: xref.provider2Result,
    confidence,
    status,
  };
}

// ---------------------------------------------------------------------------
// Email Discovery Function
// ---------------------------------------------------------------------------

function discoverEmail(
  firstName: string,
  lastName: string,
  domain: string
): string | null {
  if (!firstName || !lastName || !domain) {
    return null;
  }

  const first = firstName.trim().toLowerCase();
  const last = lastName.trim().toLowerCase();
  const cleanDomain = domain.trim().toLowerCase();

  // Validate domain has at least a TLD
  if (!cleanDomain.includes(".")) {
    return null;
  }

  // Generate candidate patterns
  const patterns: string[] = [
    `${first}.${last}@${cleanDomain}`,
    `${first}${last}@${cleanDomain}`,
    `${first}@${cleanDomain}`,
    `${first[0]}${last}@${cleanDomain}`,
    `${first}.${last[0]}@${cleanDomain}`,
    `${first}_${last}@${cleanDomain}`,
    `${first}-${last}@${cleanDomain}`,
    `${last}.${first}@${cleanDomain}`,
    `${last}${first[0]}@${cleanDomain}`,
  ];

  // In stub mode, return the first.last@ pattern as the "discovered" email
  // In production, each pattern would be verified against SMTP/API
  const discoveredEmail = patterns[0];

  // Run a basic validation on the discovered email
  const validation = validateEmail(discoveredEmail);

  if (validation.syntaxValid && !validation.isDisposable) {
    return discoveredEmail;
  }

  return null;
}

export { validateEmail, discoverEmail, type ValidationResult };
