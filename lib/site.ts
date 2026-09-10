/* ------------------------------------------------------------------ */
/*  Site configuration + content data.                                  */
/*  Edit this file to update links, copy and project data.              */
/* ------------------------------------------------------------------ */

export const SITE = {
  name: 'Anugrah A',
  role: 'Computer Science Engineering Student',
  school: 'Adi Shankara Institute of Engineering and Technology',
  location: 'Kerala, India',
  githubUser: 'brooklyndivine06-cloud',
  github: 'https://github.com/brooklyndivine06-cloud',
  /** Add your LinkedIn URL here, e.g. 'https://www.linkedin.com/in/your-handle' */
  linkedin: '',
  /** Add your email here, e.g. 'hello@example.com' — powers "Email Me" + the contact form */
  email: '',
  idam: 'https://brooklyndivine06-cloud.github.io/idam-prime/#home',
  resumePdf: '/anugrah-a-resume.pdf',
  year: '2026',
} as const;

/* ---------------------------- tech universe ------------------------ */

export type TechCat = 'Languages' | 'Frontend' | 'Backend' | 'Database' | 'Tools';
export const TECH_CATS: TechCat[] = ['Languages', 'Frontend', 'Backend', 'Database', 'Tools'];

export interface Tech {
  name: string;
  cats: TechCat[];
  tags: string[];
  usedFor: string[];
}

export const TECH: Tech[] = [
  { name: 'Python', cats: ['Languages', 'Backend'], tags: ['Scripts', 'Data', 'AI', 'Automation'], usedFor: ['Experiments'] },
  { name: 'JavaScript', cats: ['Languages', 'Frontend'], tags: ['Web Development', 'Frontend Logic', 'Interactive Interfaces'], usedFor: ['IDAM'] },
  { name: 'Java', cats: ['Languages'], tags: ['OOP', 'Core CS', 'Problem Solving'], usedFor: ['Academics'] },
  { name: 'C', cats: ['Languages'], tags: ['Systems', 'Memory', 'Fundamentals'], usedFor: ['Academics'] },
  { name: 'C++', cats: ['Languages'], tags: ['Performance', 'Data Structures'], usedFor: ['Academics'] },
  { name: 'SQL', cats: ['Languages', 'Database'], tags: ['Queries', 'Relational Data'], usedFor: ['Academics'] },
  { name: 'React', cats: ['Frontend'], tags: ['Components', 'State', 'UI Architecture'], usedFor: ['Experiments'] },
  { name: 'Node.js', cats: ['Backend'], tags: ['Runtime', 'Server Logic', 'APIs'], usedFor: ['Experiments'] },
  { name: 'Express.js', cats: ['Backend'], tags: ['REST APIs', 'Routing', 'Middleware'], usedFor: ['Experiments'] },
  { name: 'HTML', cats: ['Frontend'], tags: ['Structure', 'Semantics', 'Accessibility'], usedFor: ['IDAM'] },
  { name: 'CSS', cats: ['Frontend'], tags: ['Layout', 'Motion', 'Design Systems'], usedFor: ['IDAM'] },
  { name: 'MongoDB', cats: ['Database'], tags: ['Documents', 'Collections', 'Modelling'], usedFor: ['Experiments'] },
  { name: 'Firebase', cats: ['Backend', 'Database'], tags: ['Auth', 'Hosting', 'Realtime Data'], usedFor: ['Experiments'] },
  { name: 'Git', cats: ['Tools'], tags: ['Version Control', 'Branching', 'History'], usedFor: ['All Work'] },
  { name: 'GitHub', cats: ['Tools'], tags: ['Collaboration', 'Publishing', 'Hosting'], usedFor: ['All Work'] },
  { name: 'Linux', cats: ['Tools'], tags: ['CLI', 'Environments', 'Deployment'], usedFor: ['Daily Driver'] },
];

/* ---------------------------- IDAM data ---------------------------- */

export const IDAM_TABS = ['BUY', 'RENT', 'LAND', 'PG', 'COMMERCIAL', 'NEW PROJECTS'] as const;
export const IDAM_CITIES = ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Chennai', 'Bengaluru'] as const;

export const BUDGETS = [
  { id: 'b1', label: '< ₹50L', min: 0, max: 5_000_000 },
  { id: 'b2', label: '₹50L–₹80L', min: 5_000_000, max: 8_000_000 },
  { id: 'b3', label: '₹80L–₹1.5Cr', min: 8_000_000, max: 15_000_000 },
  { id: 'b4', label: '₹1.5Cr+', min: 15_000_000, max: Infinity },
] as const;

export type BudgetId = (typeof BUDGETS)[number]['id'];

export interface Listing {
  id: string;
  name: string;
  area: string;
  city: string;
  type: 'House' | 'Apartment' | 'Villa' | 'Land' | 'PG' | 'Commercial';
  bhk: number; // 0 for land / commercial
  price: number; // ₹ (monthly for PG)
  priceLabel: string;
  furnishing: 'Furnished' | 'Semi-furnished' | 'Unfurnished';
  verified: boolean;
  img: string;
  sqft: string;
  desc: string;
}

export const LISTINGS: Listing[] = [
  {
    id: 'marine-drive',
    name: 'Marine Drive Residency',
    area: 'Marine Drive',
    city: 'Kochi',
    type: 'Apartment',
    bhk: 2,
    price: 62_00_000,
    priceLabel: '₹62L',
    furnishing: 'Furnished',
    verified: true,
    img: '/images/prop-apartment.jpg',
    sqft: '1,050 sq.ft',
    desc: 'A two bedroom apartment on Marine Drive with water views, full furnish package and owner-verified paperwork. Ready to move in.',
  },
  {
    id: 'kerala-gate',
    name: 'Kerala Gate Townhouse',
    area: 'Kakkanad',
    city: 'Kochi',
    type: 'House',
    bhk: 2,
    price: 74_00_000,
    priceLabel: '₹74L',
    furnishing: 'Furnished',
    verified: true,
    img: '/images/prop-townhouse.jpg',
    sqft: '1,240 sq.ft',
    desc: 'Contemporary two bedroom townhouse near Infopark, walkable to cafes and transit. Furnished, with covered parking.',
  },
  {
    id: 'palm-grove',
    name: 'Palm Grove Villa',
    area: 'Aluva',
    city: 'Kochi',
    type: 'Villa',
    bhk: 4,
    price: 1_80_00_000,
    priceLabel: '₹1.8Cr',
    furnishing: 'Semi-furnished',
    verified: true,
    img: '/images/prop-villa.jpg',
    sqft: '3,600 sq.ft',
    desc: 'Four bedroom villa with infinity pool, tropical landscaping and a private terrace. Semi-furnished, gated community.',
  },
  {
    id: 'bayview',
    name: 'Bayview Towers',
    area: 'Pattom',
    city: 'Thiruvananthapuram',
    type: 'Apartment',
    bhk: 3,
    price: 85_00_000,
    priceLabel: '₹85L',
    furnishing: 'Unfurnished',
    verified: true,
    img: '/images/prop-apartment.jpg',
    sqft: '1,480 sq.ft',
    desc: 'Three bedroom apartment in a high-rise with bay-facing balconies. Unfurnished, ideal for custom interiors.',
  },
  {
    id: 'backwater-plot',
    name: 'Backwater Farm Plot',
    area: 'Moodupuzha',
    city: 'Thrissur',
    type: 'Land',
    bhk: 0,
    price: 45_00_000,
    priceLabel: '₹45L',
    furnishing: 'Unfurnished',
    verified: true,
    img: '/images/prop-land.jpg',
    sqft: '30 cents',
    desc: 'Clear-title agricultural plot near the backwaters, approved for residential conversion. Coconut grove boundary on two sides.',
  },
  {
    id: 'infopark-pg',
    name: 'Infopark Studio PG',
    area: 'Infopark',
    city: 'Kochi',
    type: 'PG',
    bhk: 1,
    price: 18_000,
    priceLabel: '₹18K / mo',
    furnishing: 'Furnished',
    verified: true,
    img: '/images/prop-interior.jpg',
    sqft: '220 sq.ft',
    desc: 'Furnished studio room for working professionals, five minutes from Infopark. Meals, housekeeping and backup power included.',
  },
  {
    id: 'heritage-house',
    name: 'Heritage House',
    area: 'Beach Road',
    city: 'Kozhikode',
    type: 'House',
    bhk: 3,
    price: 1_20_00_000,
    priceLabel: '₹1.2Cr',
    furnishing: 'Semi-furnished',
    verified: false,
    img: '/images/prop-townhouse.jpg',
    sqft: '2,100 sq.ft',
    desc: 'Restored family home on Beach Road with teak work, cross-ventilation and a large front veranda. Restoration done 2025.',
  },
  {
    id: 'omr-hub',
    name: 'OMR Commerce Hub',
    area: 'Old Mahabalipuram Rd',
    city: 'Chennai',
    type: 'Commercial',
    bhk: 0,
    price: 1_50_00_000,
    priceLabel: '₹1.5Cr',
    furnishing: 'Unfurnished',
    verified: true,
    img: '/images/prop-interior.jpg',
    sqft: '2,400 sq.ft',
    desc: 'Ground-floor commercial space with dedicated lift lobby, high street frontage and provisions for three split-AC zones.',
  },
];

export const ARCH_NODES = [
  {
    id: 'discovery',
    title: 'PROPERTY DISCOVERY',
    desc: 'Browse homes, plots, PGs and commercial space across India — with Kerala at the core. Purpose-first browsing: buy, rent, land, PG, commercial or new projects.',
    tags: ['Buy', 'Rent', 'Land', 'PG', 'Commercial', 'New Projects'],
  },
  {
    id: 'filter',
    title: 'SEARCH & FILTER',
    desc: 'Budget, bedrooms, property type, furnishing and verified-only filtering narrow the noise down to intent. Every filter composes with the others.',
    tags: ['Budget', 'Bedrooms', 'Type', 'Furnishing', 'Verified'],
  },
  {
    id: 'details',
    title: 'PROPERTY DETAILS',
    desc: 'Every listing opens into a complete picture — imagery, specs, pricing, location and owner context — so decisions happen with full information.',
    tags: ['Imagery', 'Specs', 'Pricing', 'Location'],
  },
  {
    id: 'enquiry',
    title: 'ENQUIRY',
    desc: 'Interested users reach owners with a structured enquiry — optionally flagging a site visit or home-loan assistance alongside the message.',
    tags: ['Message', 'Site visit', 'Loan assistance'],
  },
  {
    id: 'visit',
    title: 'VISIT SCHEDULING',
    desc: 'Pick a date and a time slot. The product turns intention into a concrete plan, with confirmation and a clear next step.',
    tags: ['Calendar', 'Slots', 'Confirmation'],
  },
  {
    id: 'comms',
    title: 'COMMUNICATION',
    desc: 'Messages, saved properties and a personal dashboard keep the relationship moving after the first enquiry.',
    tags: ['Messages', 'Saved', 'Dashboard'],
  },
] as const;

export const VISIT_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'] as const;

/* ---------------------------- journey data ------------------------- */

export const CERTIFICATIONS = [
  { title: 'NoSQL and MongoDB', issuer: 'Infosys Springboard', kind: 'Technical' },
  { title: 'Deployment Professional — Security Network Protection (XGS) V5.2', issuer: 'IBM', kind: 'Certified' },
  { title: 'Digital 101', issuer: 'nasscom', kind: 'Foundations' },
  { title: 'Course Completion', issuer: 'Infosys Springboard', kind: 'Technical' },
] as const;

export const EXPLORING = [
  { title: 'Web Development', copy: 'Building richer and more interactive interfaces.' },
  { title: 'Artificial Intelligence', copy: 'Exploring ways AI can become part of useful products.' },
  { title: 'Software Engineering', copy: 'Learning how to structure maintainable applications.' },
  { title: 'Product Thinking', copy: 'Understanding why people use products, not just how they work.' },
] as const;

export const PROCESS_STEPS = [
  { n: '01', title: 'IDEA', q: 'What problem are we solving?' },
  { n: '02', title: 'STRUCTURE', q: 'What should the user experience?' },
  { n: '03', title: 'DESIGN', q: 'How should the interface communicate?' },
  { n: '04', title: 'BUILD', q: 'Turn the concept into code.' },
  { n: '05', title: 'TEST', q: "Find what doesn't work." },
  { n: '06', title: 'ITERATE', q: 'Improve the experience.' },
] as const;

export const CHAPTERS = [
  { n: '01', title: 'THE PERSON' },
  { n: '02', title: 'THE BUILDER' },
  { n: '03', title: 'THE PRODUCT' },
  { n: '04', title: 'THE PROCESS' },
  { n: '05', title: 'THE JOURNEY' },
  { n: '06', title: "WHAT'S NEXT" },
] as const;

export const ABOUT_COPY = [
  "I'm a Computer Science and Engineering student who enjoys exploring the intersection between software, design, and emerging technology.",
  'I’m especially interested in creating web experiences that feel intuitive instead of merely functional. I enjoy taking an idea from a rough concept, breaking it into smaller problems, designing the interaction, and turning it into something people can actually interact with.',
  'My current work spans web development, databases, AI-powered experiences, frontend engineering, and practical software projects.',
];

export const PHILOSOPHY = [
  { n: '01', title: 'THINK', copy: 'Understand the problem before reaching for the technology.' },
  { n: '02', title: 'BUILD', copy: 'Turn concepts into working systems and usable interfaces.' },
  { n: '03', title: 'ITERATE', copy: 'Test, refine, learn, and keep improving.' },
] as const;

export const CURRENTLY_LEARNING = [
  'Software Engineering',
  'Web Development',
  'Databases',
  'Artificial Intelligence',
  'Problem Solving',
] as const;

export function inr(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}
