import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      fromEmail: "",
      fromName: "Floeey Team",
      dailySendLimit: 5,
      aiApiKey: "",
      aiProvider: "anthropic",
    },
  })

  // Create ICP profiles
  const icp1 = await prisma.icpProfile.create({
    data: {
      name: "High-Growth SaaS",
      industries: JSON.stringify(["SaaS", "DevTools", "AI/ML", "Data Analytics"]),
      companySizeMin: 50,
      companySizeMax: 500,
      locations: JSON.stringify(["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA"]),
      technologies: JSON.stringify(["React", "TypeScript", "AWS", "Python"]),
      fundingStages: JSON.stringify(["series-a", "series-b", "series-c"]),
      revenueMin: 1000000,
      revenueMax: 50000000,
      keywords: JSON.stringify(["fast-growing", "product-led", "B2B"]),
    },
  })

  const icp2 = await prisma.icpProfile.create({
    data: {
      name: "Enterprise Tech",
      industries: JSON.stringify(["Cloud Infrastructure", "Cybersecurity", "FinTech", "HR Tech"]),
      companySizeMin: 500,
      companySizeMax: null,
      locations: JSON.stringify(["San Francisco, CA", "New York, NY", "London, UK", "Boston, MA"]),
      technologies: JSON.stringify(["AWS", "Kubernetes", "Go", "Java"]),
      fundingStages: JSON.stringify(["series-c", "series-d-plus", "public"]),
      revenueMin: 50000000,
      revenueMax: null,
      keywords: JSON.stringify(["enterprise", "Fortune 500 clients", "IPO track"]),
    },
  })

  // Create companies
  const companies = [
    {
      name: "Datawise Analytics",
      description: "AI-powered data analytics platform that helps B2B SaaS companies understand user behavior and predict churn with 95% accuracy.",
      industry: "Data Analytics",
      employeeCount: 180,
      employeeRange: "51-200",
      location: "San Francisco, CA",
      country: "United States",
      website: "datawise.io",
      fundingStage: "series-b",
      fundingAmount: 45000000,
      lastFundingDate: "2025-08-15",
      technologies: JSON.stringify(["Python", "React", "AWS", "Snowflake", "TailwindCSS"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "SecureNet Systems",
      description: "Next-generation cybersecurity platform providing AI-driven threat detection and automated response for mid-market companies.",
      industry: "Cybersecurity",
      employeeCount: 85,
      employeeRange: "51-200",
      location: "Austin, TX",
      country: "United States",
      website: "securenetsystems.com",
      fundingStage: "series-a",
      fundingAmount: 18000000,
      lastFundingDate: "2025-11-20",
      technologies: JSON.stringify(["Go", "React", "AWS", "Kubernetes", "Elasticsearch"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "CloudStack Pro",
      description: "Enterprise-grade cloud infrastructure management platform with multi-cloud orchestration and cost optimization built in.",
      industry: "Cloud Infrastructure",
      employeeCount: 450,
      employeeRange: "201-500",
      location: "Seattle, WA",
      country: "United States",
      website: "cloudstackpro.com",
      fundingStage: "series-c",
      fundingAmount: 120000000,
      lastFundingDate: "2025-06-10",
      technologies: JSON.stringify(["Go", "TypeScript", "AWS", "Google Cloud", "Terraform"]),
      matchedIcpId: icp2.id,
    },
    {
      name: "TalentFlow",
      description: "AI recruiting platform that automates candidate sourcing, screening, and scheduling. Reduces time-to-hire by 60%.",
      industry: "HR Tech",
      employeeCount: 120,
      employeeRange: "51-200",
      location: "New York, NY",
      country: "United States",
      website: "talentflow.ai",
      fundingStage: "series-b",
      fundingAmount: 35000000,
      lastFundingDate: "2025-09-05",
      technologies: JSON.stringify(["Python", "React", "Next.js", "PostgreSQL", "Redis"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "PayStream",
      description: "Modern payment infrastructure for SaaS companies. Handles billing, subscriptions, and revenue recognition in one platform.",
      industry: "FinTech",
      employeeCount: 310,
      employeeRange: "201-500",
      location: "San Francisco, CA",
      country: "United States",
      website: "paystream.com",
      fundingStage: "series-c",
      fundingAmount: 85000000,
      lastFundingDate: "2025-04-22",
      technologies: JSON.stringify(["Java", "React", "AWS", "PostgreSQL", "Kafka"]),
      matchedIcpId: icp2.id,
    },
    {
      name: "DevPulse",
      description: "Developer productivity platform with built-in CI/CD, code review automation, and engineering metrics dashboards.",
      industry: "DevTools",
      employeeCount: 65,
      employeeRange: "51-200",
      location: "Austin, TX",
      country: "United States",
      website: "devpulse.dev",
      fundingStage: "series-a",
      fundingAmount: 22000000,
      lastFundingDate: "2025-10-18",
      technologies: JSON.stringify(["TypeScript", "React", "Docker", "Kubernetes", "GraphQL"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "GreenMetrics",
      description: "ESG and carbon footprint tracking platform for enterprises. Automates sustainability reporting and compliance.",
      industry: "Clean Energy",
      employeeCount: 95,
      employeeRange: "51-200",
      location: "Boston, MA",
      country: "United States",
      website: "greenmetrics.co",
      fundingStage: "series-a",
      fundingAmount: 15000000,
      lastFundingDate: "2025-07-30",
      technologies: JSON.stringify(["Python", "Vue.js", "Google Cloud", "MongoDB", "Databricks"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "LegalMind AI",
      description: "AI-powered legal document review and contract analysis platform. Trusted by 200+ law firms and corporate legal teams.",
      industry: "Legal Tech",
      employeeCount: 140,
      employeeRange: "51-200",
      location: "New York, NY",
      country: "United States",
      website: "legalmind.ai",
      fundingStage: "series-b",
      fundingAmount: 40000000,
      lastFundingDate: "2025-05-12",
      technologies: JSON.stringify(["Python", "React", "AWS", "Elasticsearch", "FastAPI"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "ShipLogix",
      description: "Supply chain optimization platform using real-time data and ML to reduce shipping costs and delivery times for e-commerce.",
      industry: "Logistics",
      employeeCount: 220,
      employeeRange: "201-500",
      location: "Chicago, IL",
      country: "United States",
      website: "shiplogix.com",
      fundingStage: "series-b",
      fundingAmount: 55000000,
      lastFundingDate: "2025-03-08",
      technologies: JSON.stringify(["Java", "Angular", "AWS", "PostgreSQL", "Redis"]),
      matchedIcpId: icp1.id,
    },
    {
      name: "InsureFlow",
      description: "Digital insurance platform offering API-first embedded insurance products for SaaS platforms and fintech companies.",
      industry: "InsurTech",
      employeeCount: 175,
      employeeRange: "51-200",
      location: "Denver, CO",
      country: "United States",
      website: "insureflow.io",
      fundingStage: "series-b",
      fundingAmount: 50000000,
      lastFundingDate: "2025-01-25",
      technologies: JSON.stringify(["Node.js", "React", "AWS", "PostgreSQL", "Kafka"]),
      matchedIcpId: icp1.id,
    },
  ]

  const createdCompanies = []
  for (const company of companies) {
    const created = await prisma.company.create({ data: company })
    createdCompanies.push(created)
  }

  // Create news for each company
  const newsTemplates = [
    [
      { title: "Datawise Analytics Raises $45M to Expand AI Analytics Platform", source: "TechCrunch", snippet: "The San Francisco-based startup plans to use the funding to expand into European markets and build new predictive features." },
      { title: "How Datawise Is Using AI to Solve the Churn Problem", source: "Forbes", snippet: "CEO Sarah Chen explains how their ML models achieve 95% accuracy in predicting customer churn before it happens." },
    ],
    [
      { title: "SecureNet Systems Closes $18M Series A for AI Cybersecurity", source: "VentureBeat", snippet: "The Austin startup's AI-driven threat detection platform has already been adopted by over 150 mid-market companies." },
      { title: "The Rising Threat Landscape: How SecureNet Is Fighting Back", source: "Dark Reading", snippet: "SecureNet's automated response system can neutralize threats in under 30 seconds, a 10x improvement over manual processes." },
    ],
    [
      { title: "CloudStack Pro Lands $120M Series C Led by Sequoia", source: "TechCrunch", snippet: "The cloud management platform now manages over $2B in cloud spending for Fortune 500 clients." },
      { title: "Multi-Cloud Management: CloudStack Pro's Answer to Cloud Sprawl", source: "InfoWorld", snippet: "With enterprises averaging 3.4 cloud providers, CloudStack Pro's unified dashboard is becoming essential infrastructure." },
    ],
    [
      { title: "TalentFlow AI Cuts Time-to-Hire by 60% for Enterprise Clients", source: "HR Dive", snippet: "The AI recruiting platform has processed over 10 million candidates and saved clients an estimated $500M in recruiting costs." },
      { title: "TalentFlow Raises $35M to Automate the Recruiting Pipeline", source: "Fortune", snippet: "CEO Michael Torres says the platform now handles everything from sourcing to scheduling interviews." },
    ],
    [
      { title: "PayStream Hits $85M in Funding, Eyes IPO in 2027", source: "Bloomberg", snippet: "The payments infrastructure company processes $8B annually and is growing revenue at 150% year-over-year." },
      { title: "Why SaaS Companies Are Switching to PayStream for Billing", source: "SaaStr", snippet: "PayStream's unified billing platform handles subscriptions, usage-based pricing, and revenue recognition." },
    ],
    [
      { title: "DevPulse Launches Code Review AI, Raises $22M Series A", source: "The Verge", snippet: "The developer productivity platform claims its AI can catch 80% of code review issues before human reviewers see them." },
      { title: "Engineering Metrics That Actually Matter: A DevPulse Guide", source: "Dev.to", snippet: "DevPulse CTO explains why DORA metrics are just the beginning of understanding developer productivity." },
    ],
    [
      { title: "GreenMetrics Closes $15M to Automate ESG Reporting", source: "GreenBiz", snippet: "The platform automatically tracks Scope 1, 2, and 3 emissions and generates reports compliant with SEC and EU regulations." },
      { title: "How GreenMetrics Makes Carbon Tracking Actually Useful", source: "Fast Company", snippet: "Instead of just measuring emissions, GreenMetrics provides actionable recommendations to reduce corporate carbon footprints." },
    ],
    [
      { title: "LegalMind AI Raises $40M to Transform Contract Review", source: "Law.com", snippet: "The AI platform can review contracts 100x faster than human lawyers while maintaining 98% accuracy." },
      { title: "AI in Law: LegalMind's Vision for the Future of Legal Work", source: "Forbes", snippet: "CEO David Park believes AI won't replace lawyers but will make them 10x more productive." },
    ],
    [
      { title: "ShipLogix Secures $55M to Optimize Global Supply Chains", source: "Supply Chain Dive", snippet: "The ML-powered platform has helped e-commerce companies reduce shipping costs by an average of 23%." },
      { title: "Real-Time Supply Chain: How ShipLogix Predicts Delays Before They Happen", source: "Wired", snippet: "By analyzing weather, traffic, and historical data, ShipLogix can predict delivery delays 48 hours in advance." },
    ],
    [
      { title: "InsureFlow Raises $50M to Expand Embedded Insurance Platform", source: "Insurance Journal", snippet: "The API-first platform allows any SaaS company to offer insurance products to their customers in minutes." },
      { title: "Embedded Insurance Is the Next Big Fintech Wave", source: "TechCrunch", snippet: "InsureFlow CEO Lisa Wang explains why embedded insurance will be a $700B market by 2030." },
    ],
  ]

  for (let i = 0; i < createdCompanies.length; i++) {
    for (const news of newsTemplates[i]) {
      await prisma.companyNews.create({
        data: {
          companyId: createdCompanies[i].id,
          title: news.title,
          source: news.source,
          url: `https://example.com/news/${createdCompanies[i].name.toLowerCase().replace(/\s+/g, "-")}`,
          publishedAt: "2025-12-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
          snippet: news.snippet,
        },
      })
    }
  }

  // Create contacts (3 per company)
  const contactTemplates = [
    // Datawise
    [
      { firstName: "Sarah", lastName: "Chen", title: "CEO & Co-Founder", department: "Executive", workEmail: "sarah@datawise.io", personalEmail: "sarah.chen.sf@gmail.com", workPhone: "+1-415-555-0101", linkedinUrl: "https://linkedin.com/in/sarah-chen" },
      { firstName: "Marcus", lastName: "Rivera", title: "VP of Engineering", department: "Engineering", workEmail: "marcus@datawise.io", personalEmail: null, workPhone: "+1-415-555-0102", linkedinUrl: "https://linkedin.com/in/marcus-rivera" },
      { firstName: "Priya", lastName: "Sharma", title: "Head of Product", department: "Product", workEmail: "priya@datawise.io", personalEmail: "priya.sharma92@gmail.com", workPhone: null, linkedinUrl: "https://linkedin.com/in/priya-sharma" },
    ],
    // SecureNet
    [
      { firstName: "James", lastName: "Mitchell", title: "CTO", department: "Engineering", workEmail: "james@securenetsystems.com", personalEmail: null, workPhone: "+1-512-555-0201", linkedinUrl: "https://linkedin.com/in/james-mitchell" },
      { firstName: "Emily", lastName: "Zhang", title: "VP of Sales", department: "Sales", workEmail: "emily@securenetsystems.com", personalEmail: "emily.zhang.tx@gmail.com", workPhone: "+1-512-555-0202", linkedinUrl: "https://linkedin.com/in/emily-zhang" },
      { firstName: "Robert", lastName: "Kim", title: "Head of Customer Success", department: "Customer Success", workEmail: "robert@securenetsystems.com", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/robert-kim" },
    ],
    // CloudStack
    [
      { firstName: "Daniel", lastName: "Park", title: "CEO", department: "Executive", workEmail: "daniel@cloudstackpro.com", personalEmail: null, workPhone: "+1-206-555-0301", linkedinUrl: "https://linkedin.com/in/daniel-park" },
      { firstName: "Lisa", lastName: "Johnson", title: "VP of Engineering", department: "Engineering", workEmail: "lisa@cloudstackpro.com", personalEmail: "lisa.j.seattle@gmail.com", workPhone: "+1-206-555-0302", linkedinUrl: "https://linkedin.com/in/lisa-johnson" },
      { firstName: "Kevin", lastName: "O'Brien", title: "Head of Sales", department: "Sales", workEmail: "kevin@cloudstackpro.com", personalEmail: null, workPhone: "+1-206-555-0303", linkedinUrl: "https://linkedin.com/in/kevin-obrien" },
    ],
    // TalentFlow
    [
      { firstName: "Michael", lastName: "Torres", title: "CEO & Founder", department: "Executive", workEmail: "michael@talentflow.ai", personalEmail: "m.torres.nyc@gmail.com", workPhone: "+1-212-555-0401", linkedinUrl: "https://linkedin.com/in/michael-torres" },
      { firstName: "Rachel", lastName: "Green", title: "CTO", department: "Engineering", workEmail: "rachel@talentflow.ai", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/rachel-green" },
      { firstName: "David", lastName: "Lee", title: "VP of Product", department: "Product", workEmail: "david@talentflow.ai", personalEmail: null, workPhone: "+1-212-555-0403", linkedinUrl: "https://linkedin.com/in/david-lee" },
    ],
    // PayStream
    [
      { firstName: "Jennifer", lastName: "Wu", title: "CEO", department: "Executive", workEmail: "jennifer@paystream.com", personalEmail: null, workPhone: "+1-415-555-0501", linkedinUrl: "https://linkedin.com/in/jennifer-wu" },
      { firstName: "Alex", lastName: "Petrov", title: "CTO", department: "Engineering", workEmail: "alex@paystream.com", personalEmail: "alex.petrov.dev@gmail.com", workPhone: "+1-415-555-0502", linkedinUrl: "https://linkedin.com/in/alex-petrov" },
      { firstName: "Samantha", lastName: "Brown", title: "VP of Marketing", department: "Marketing", workEmail: "samantha@paystream.com", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/samantha-brown" },
    ],
    // DevPulse
    [
      { firstName: "Chris", lastName: "Nguyen", title: "CEO & Co-Founder", department: "Executive", workEmail: "chris@devpulse.dev", personalEmail: "chris.ng.dev@gmail.com", workPhone: "+1-512-555-0601", linkedinUrl: "https://linkedin.com/in/chris-nguyen" },
      { firstName: "Anna", lastName: "Kowalski", title: "CTO", department: "Engineering", workEmail: "anna@devpulse.dev", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/anna-kowalski" },
      { firstName: "Tom", lastName: "Harris", title: "Head of Growth", department: "Marketing", workEmail: "tom@devpulse.dev", personalEmail: null, workPhone: "+1-512-555-0603", linkedinUrl: "https://linkedin.com/in/tom-harris" },
    ],
    // GreenMetrics
    [
      { firstName: "Maya", lastName: "Patel", title: "CEO", department: "Executive", workEmail: "maya@greenmetrics.co", personalEmail: "maya.patel.bos@gmail.com", workPhone: "+1-617-555-0701", linkedinUrl: "https://linkedin.com/in/maya-patel" },
      { firstName: "Jason", lastName: "Taylor", title: "VP of Engineering", department: "Engineering", workEmail: "jason@greenmetrics.co", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/jason-taylor" },
      { firstName: "Sofia", lastName: "Martinez", title: "Head of Partnerships", department: "Sales", workEmail: "sofia@greenmetrics.co", personalEmail: null, workPhone: "+1-617-555-0703", linkedinUrl: "https://linkedin.com/in/sofia-martinez" },
    ],
    // LegalMind
    [
      { firstName: "David", lastName: "Park", title: "CEO", department: "Executive", workEmail: "david@legalmind.ai", personalEmail: null, workPhone: "+1-212-555-0801", linkedinUrl: "https://linkedin.com/in/david-park-legal" },
      { firstName: "Catherine", lastName: "Wells", title: "CTO", department: "Engineering", workEmail: "catherine@legalmind.ai", personalEmail: "cat.wells.nyc@gmail.com", workPhone: null, linkedinUrl: "https://linkedin.com/in/catherine-wells" },
      { firstName: "Andrew", lastName: "Foster", title: "VP of Sales", department: "Sales", workEmail: "andrew@legalmind.ai", personalEmail: null, workPhone: "+1-212-555-0803", linkedinUrl: "https://linkedin.com/in/andrew-foster" },
    ],
    // ShipLogix
    [
      { firstName: "Brian", lastName: "Murphy", title: "CEO & Founder", department: "Executive", workEmail: "brian@shiplogix.com", personalEmail: null, workPhone: "+1-312-555-0901", linkedinUrl: "https://linkedin.com/in/brian-murphy" },
      { firstName: "Nicole", lastName: "Anderson", title: "CTO", department: "Engineering", workEmail: "nicole@shiplogix.com", personalEmail: "nicole.a.chi@gmail.com", workPhone: "+1-312-555-0902", linkedinUrl: "https://linkedin.com/in/nicole-anderson" },
      { firstName: "Ryan", lastName: "Chen", title: "VP of Operations", department: "Operations", workEmail: "ryan@shiplogix.com", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/ryan-chen" },
    ],
    // InsureFlow
    [
      { firstName: "Lisa", lastName: "Wang", title: "CEO", department: "Executive", workEmail: "lisa@insureflow.io", personalEmail: "lisa.wang.den@gmail.com", workPhone: "+1-720-555-1001", linkedinUrl: "https://linkedin.com/in/lisa-wang" },
      { firstName: "Mark", lastName: "Stevens", title: "CTO", department: "Engineering", workEmail: "mark@insureflow.io", personalEmail: null, workPhone: "+1-720-555-1002", linkedinUrl: "https://linkedin.com/in/mark-stevens" },
      { firstName: "Hannah", lastName: "Brooks", title: "VP of Product", department: "Product", workEmail: "hannah@insureflow.io", personalEmail: null, workPhone: null, linkedinUrl: "https://linkedin.com/in/hannah-brooks" },
    ],
  ]

  for (let i = 0; i < createdCompanies.length; i++) {
    for (const contact of contactTemplates[i]) {
      await prisma.contact.create({
        data: {
          companyId: createdCompanies[i].id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          fullName: `${contact.firstName} ${contact.lastName}`,
          title: contact.title,
          department: contact.department,
          workEmail: contact.workEmail,
          personalEmail: contact.personalEmail,
          workPhone: contact.workPhone,
          personalPhone: null,
          linkedinUrl: contact.linkedinUrl,
          facebookUrl: null,
          instagramUrl: null,
        },
      })
    }
  }

  // Create email sequences
  const seq1 = await prisma.emailSequence.create({
    data: {
      name: "Initial Outreach",
      status: "active",
    },
  })

  await prisma.sequenceStep.createMany({
    data: [
      { sequenceId: seq1.id, order: 1, delayDays: 0, subject: "Quick question about {companyName}", body: "Hi {firstName},\n\nI noticed {companyName} recently {newsHeadline} — congrats on the momentum!\n\nI'm reaching out because we help companies like yours streamline their lead generation. Would love to share how we helped a similar company in {industry} increase their pipeline by 3x.\n\nWorth a quick 15-min chat?\n\nBest,\nFloeey Team", type: "initial" },
      { sequenceId: seq1.id, order: 2, delayDays: 3, subject: "Re: Quick question about {companyName}", body: "Hi {firstName},\n\nJust wanted to bump this to the top of your inbox. I know things get busy as {title} at a growing company.\n\nHappy to work around your schedule — even a 10-minute call would be great.\n\nBest,\nFloeey Team", type: "follow-up" },
      { sequenceId: seq1.id, order: 3, delayDays: 7, subject: "Last note from me", body: "Hi {firstName},\n\nI don't want to be a pest, so this will be my last email. If the timing isn't right, I totally understand.\n\nIf you ever want to explore how we can help {companyName} with lead generation, just reply to this email — I'll be here.\n\nWishing you and the team all the best!\n\nFloeey Team", type: "breakup" },
    ],
  })

  const seq2 = await prisma.emailSequence.create({
    data: {
      name: "Product Demo Follow-up",
      status: "draft",
    },
  })

  await prisma.sequenceStep.createMany({
    data: [
      { sequenceId: seq2.id, order: 1, delayDays: 0, subject: "Thanks for the chat, {firstName}!", body: "Hi {firstName},\n\nGreat speaking with you today! As discussed, I'm attaching a brief overview of how we can help {companyName}.\n\nLooking forward to the next steps.\n\nBest,\nFloeey Team", type: "initial" },
      { sequenceId: seq2.id, order: 2, delayDays: 2, subject: "Quick follow-up on our demo", body: "Hi {firstName},\n\nHad a chance to review the materials? Happy to jump on a quick call to answer any questions.\n\nBest,\nFloeey Team", type: "follow-up" },
      { sequenceId: seq2.id, order: 3, delayDays: 5, subject: "Checking in — any questions?", body: "Hi {firstName},\n\nJust checking in. Would it be helpful to schedule a follow-up with your team at {companyName}?\n\nBest,\nFloeey Team", type: "follow-up" },
      { sequenceId: seq2.id, order: 4, delayDays: 7, subject: "Should I close the loop?", body: "Hi {firstName},\n\nI haven't heard back, so I wanted to check — should I close this out for now, or is there still interest?\n\nEither way, no worries at all. Happy to reconnect whenever the timing is better.\n\nBest,\nFloeey Team", type: "breakup" },
    ],
  })

  console.log("Database seeded successfully!")
  console.log(`- ${createdCompanies.length} companies`)
  console.log(`- ${createdCompanies.length * 3} contacts`)
  console.log(`- 2 ICP profiles`)
  console.log(`- 2 email sequences`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
