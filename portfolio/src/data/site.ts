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
  location: str(env.PUBLIC_LOCATION_LABEL),
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

/* The Work list. Kinds follow the READMEs in this repo: the first three were built for real businesses as demos, the rest are concepts. */
export const projects = [
  { name: 'Doves UK', slug: 'doves-uk', kind: 'Client demo', blurb: 'Funeral and repatriation cover, one page', path: '/doves-uk/' },
  { name: 'ILÉ IFÉ', slug: 'ileife', kind: 'Client demo', blurb: 'Facials studio, South London', path: '/ileife/' },
  { name: 'DJ ESKA', slug: 'djeska', kind: 'Client demo', blurb: 'DJ and events, Hampshire', path: '/djeska/' },
  { name: 'Halcyon', slug: 'halcyon', kind: 'Concept', blurb: 'Cyber security landing page, Three.js', path: '/halcyon/' },
  { name: 'Orra', slug: 'orra', kind: 'Concept', blurb: 'Architectural residences, scroll-driven', path: '/orra/' },
  { name: 'Brew More', slug: 'more-coffee', kind: 'Concept', blurb: 'Protein iced coffee, motion study', path: '/more-coffee/' },
] as const;
