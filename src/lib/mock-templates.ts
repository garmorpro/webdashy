export type MockTemplate = {
  id: string;
  name: string;
  slug: string;
  category: string;
  industry: string;
  tags: string[];
  status: "Active" | "Draft" | "Archived";
  previewUrl: string;
  gradient: string; // placeholder "thumbnail" until real screenshots are uploaded
};

// Mock data for the Templates page (Phase 2 will replace this with real
// Prisma queries against the Template model). Categories mirror
// product-build.md §4.
export const categories = [
  "All",
  "Business",
  "Local Services",
  "Construction",
  "Restaurant",
  "Ecommerce",
  "Portfolio",
  "Health & Wellness",
  "Professional Services",
  "Other",
] as const;

export const mockTemplates: MockTemplate[] = [
  {
    id: "1",
    name: "Modern Construction",
    slug: "modern-construction",
    category: "Construction",
    industry: "Construction",
    tags: ["modern", "bold", "contractor"],
    status: "Active",
    previewUrl: "https://example.com/demos/modern-construction",
    gradient: "from-blue-600 to-blue-400",
  },
  {
    id: "2",
    name: "Construction Pro",
    slug: "construction-pro",
    category: "Construction",
    industry: "Construction",
    tags: ["professional", "industrial"],
    status: "Active",
    previewUrl: "https://example.com/demos/construction-pro",
    gradient: "from-slate-700 to-slate-500",
  },
  {
    id: "3",
    name: "Builder Elite",
    slug: "builder-elite",
    category: "Construction",
    industry: "Construction",
    tags: ["premium", "residential"],
    status: "Active",
    previewUrl: "https://example.com/demos/builder-elite",
    gradient: "from-amber-600 to-amber-400",
  },
  {
    id: "4",
    name: "Industrial Strength",
    slug: "industrial-strength",
    category: "Construction",
    industry: "Construction",
    tags: ["heavy-duty", "commercial"],
    status: "Active",
    previewUrl: "https://example.com/demos/industrial-strength",
    gradient: "from-zinc-700 to-zinc-500",
  },
  {
    id: "5",
    name: "Bloom & Co.",
    slug: "bloom-and-co",
    category: "Business",
    industry: "Marketing",
    tags: ["clean", "friendly"],
    status: "Active",
    previewUrl: "https://example.com/demos/bloom-and-co",
    gradient: "from-pink-500 to-rose-400",
  },
  {
    id: "6",
    name: "Roofing Pro",
    slug: "roofing-pro",
    category: "Local Services",
    industry: "Roofing",
    tags: ["local", "trust"],
    status: "Active",
    previewUrl: "https://example.com/demos/roofing-pro",
    gradient: "from-orange-600 to-orange-400",
  },
  {
    id: "7",
    name: "Fresh Table",
    slug: "fresh-table",
    category: "Restaurant",
    industry: "Restaurant",
    tags: ["food", "warm"],
    status: "Active",
    previewUrl: "https://example.com/demos/fresh-table",
    gradient: "from-red-600 to-red-400",
  },
  {
    id: "8",
    name: "Shopfront Basics",
    slug: "shopfront-basics",
    category: "Ecommerce",
    industry: "Retail",
    tags: ["storefront", "simple"],
    status: "Draft",
    previewUrl: "https://example.com/demos/shopfront-basics",
    gradient: "from-emerald-600 to-emerald-400",
  },
  {
    id: "9",
    name: "Portfolio Minimal",
    slug: "portfolio-minimal",
    category: "Portfolio",
    industry: "Creative",
    tags: ["minimal", "gallery"],
    status: "Active",
    previewUrl: "https://example.com/demos/portfolio-minimal",
    gradient: "from-violet-600 to-violet-400",
  },
  {
    id: "10",
    name: "FitLife Studio",
    slug: "fitlife-studio",
    category: "Health & Wellness",
    industry: "Fitness",
    tags: ["energetic", "bold"],
    status: "Active",
    previewUrl: "https://example.com/demos/fitlife-studio",
    gradient: "from-teal-600 to-teal-400",
  },
  {
    id: "11",
    name: "Local Services Dark",
    slug: "local-services-dark",
    category: "Local Services",
    industry: "Home Services",
    tags: ["dark mode", "sleek"],
    status: "Active",
    previewUrl: "https://example.com/demos/local-services-dark",
    gradient: "from-slate-900 to-slate-700",
  },
  {
    id: "12",
    name: "Contractor Elite",
    slug: "contractor-elite",
    category: "Professional Services",
    industry: "Consulting",
    tags: ["professional", "trust"],
    status: "Archived",
    previewUrl: "https://example.com/demos/contractor-elite",
    gradient: "from-indigo-600 to-indigo-400",
  },
];
