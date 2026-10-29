/* Everything editable about the site that is not copy lives in portfolio/.env (see .env.example). */
const env = import.meta.env;
const str = (v: unknown, d = '') => (typeof v === 'string' && v.trim() ? v.trim() : d);

const owner = str(env.PUBLIC_OWNER_NAME, 'Aadithya Sunil');

export const site = {
  url: str(env.PUBLIC_SITE_URL, 'http://localhost:4321').replace(/\/$/, ''),
  /* Until a brand name is chosen the brand is the owner's name */
  brand: str(env.PUBLIC_BRAND_NAME, owner),
  owner,
  short: str(env.PUBLIC_OWNER_SHORT_NAME, 'Aadi'),
  role: str(env.PUBLIC_OWNER_ROLE, 'Digital Marketer & Web Designer'),
  timezone: str(env.PUBLIC_TIMEZONE, 'Europe/London'),
  /* Shown before the clock in the header */
  location: str(env.PUBLIC_LOCATION_LABEL, 'Based in the UK'),
  email: str(env.PUBLIC_CONTACT_EMAIL),
  /* Preview builds stay out of search results until PUBLIC_NOINDEX=false */
  noindex: str(env.PUBLIC_NOINDEX, 'true') !== 'false',
  demosUrl: str(env.PUBLIC_DEMOS_URL, 'https://clientdemo.maximusmediascape.workers.dev').replace(/\/$/, ''),
  cfToken: str(env.PUBLIC_CF_ANALYTICS_TOKEN),
  gscVerification: str(env.PUBLIC_GOOGLE_SITE_VERIFICATION),
  socials: [
    { label: 'LinkedIn', href: str(env.PUBLIC_LINKEDIN_URL) },
    { label: 'Instagram', href: str(env.PUBLIC_INSTAGRAM_URL) },
    { label: 'X', href: str(env.PUBLIC_X_URL) },
    { label: 'GitHub', href: str(env.PUBLIC_GITHUB_URL) },
  ].filter((s) => s.href),
};

export const description = `${site.short} builds cool, SEO-friendly websites: design, development, SEO and marketing in one place.`;

/* The Work list. Every project is a concept build: made to show how I work, whether or not a real business was in mind. */
/* In the order they are shown. `tint` is the colour of the project's tile in the footer stack. */
export const projects = [
  { name: 'Halcyon', slug: 'halcyon', kind: 'Concept build', blurb: 'A cyber security landing page', path: '/halcyon/', tint: '#2b6cd9' },
  { name: 'Brew More', slug: 'more-coffee', kind: 'Concept build', blurb: 'Protein iced coffee, a motion study', path: '/more-coffee/', tint: '#c9a27a' },
  { name: 'Orra', slug: 'orra', kind: 'Concept build', blurb: 'Architectural residences, driven by scroll', path: '/orra/', tint: '#8fa1b3' },
  { name: 'ILÉ IFÉ', slug: 'ileife', kind: 'Concept build', blurb: 'A facials studio in South London', path: '/ileife/', tint: '#7a4a2b' },
  { name: 'DJ ESKA', slug: 'djeska', kind: 'Concept build', blurb: 'DJ and events in Hampshire', path: '/djeska/', tint: '#d9a82e' },
  { name: 'Doves UK', slug: 'doves-uk', kind: 'Concept build', blurb: 'Funeral and repatriation cover, one page', path: '/doves-uk/', tint: '#1b4b8f' },
] as const;
