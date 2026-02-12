import type { FundingStage, MergeVariable } from "@/types";

export const INDUSTRIES = [
  "SaaS",
  "FinTech",
  "HealthTech",
  "EdTech",
  "MarTech",
  "E-commerce",
  "Cybersecurity",
  "DevTools",
  "AI/ML",
  "Cloud Infrastructure",
  "Real Estate Tech",
  "HR Tech",
  "Legal Tech",
  "Supply Chain",
  "Clean Energy",
  "Logistics",
  "Data Analytics",
  "Biotech",
  "InsurTech",
  "AgTech",
] as const;

export const FUNDING_STAGES: { value: FundingStage; label: string }[] = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "series-c", label: "Series C" },
  { value: "series-d-plus", label: "Series D+" },
  { value: "public", label: "Public" },
  { value: "bootstrapped", label: "Bootstrapped" },
];

export const COMPANY_SIZES = [
  { label: "1-10", min: 1, max: 10 },
  { label: "11-50", min: 11, max: 50 },
  { label: "51-200", min: 51, max: 200 },
  { label: "201-500", min: 201, max: 500 },
  { label: "501-1000", min: 501, max: 1000 },
  { label: "1001-5000", min: 1001, max: 5000 },
  { label: "5000+", min: 5001, max: null },
] as const;

export const LOCATIONS = [
  "San Francisco, CA",
  "New York, NY",
  "Austin, TX",
  "Seattle, WA",
  "Boston, MA",
  "Los Angeles, CA",
  "Chicago, IL",
  "Denver, CO",
  "Miami, FL",
  "London, UK",
  "Berlin, Germany",
  "Toronto, Canada",
  "Tel Aviv, Israel",
  "Singapore",
  "Bangalore, India",
] as const;

export const TECHNOLOGIES = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "AWS",
  "Google Cloud",
  "Azure",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST API",
  "Terraform",
  "Kafka",
  "Elasticsearch",
  "TailwindCSS",
  "Vue.js",
  "Angular",
  "Django",
  "FastAPI",
  "Java",
  "Snowflake",
  "Databricks",
  "Vercel",
  "Supabase",
] as const;

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Customer Success",
  "Operations",
  "Finance",
  "Human Resources",
  "Legal",
  "Data Science",
  "DevOps",
  "Security",
  "Executive",
] as const;

export const MERGE_VARIABLES: { key: MergeVariable; label: string }[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "fullName", label: "Full Name" },
  { key: "companyName", label: "Company Name" },
  { key: "title", label: "Job Title" },
  { key: "industry", label: "Industry" },
  { key: "newsHeadline", label: "Recent News Headline" },
];

export const EMAIL_STATUSES = [
  { value: "draft", label: "Draft", color: "#6b7280" },
  { value: "scheduled", label: "Scheduled", color: "#f59e0b" },
  { value: "sent", label: "Sent", color: "#3b82f6" },
  { value: "opened", label: "Opened", color: "#8b5cf6" },
  { value: "replied", label: "Replied", color: "#10b981" },
] as const;

export const PIPELINE_STAGES = [
  { name: "New Lead", color: "#6b7280" },
  { name: "Contacted", color: "#3b82f6" },
  { name: "Engaged", color: "#8b5cf6" },
  { name: "Qualified", color: "#f59e0b" },
  { name: "Proposal Sent", color: "#f97316" },
  { name: "Negotiation", color: "#ec4899" },
  { name: "Closed Won", color: "#10b981" },
  { name: "Closed Lost", color: "#ef4444" },
] as const;
