import type { APIRoute } from 'astro';
import { site } from '../data/site';

/* Generated so it always matches the .env: closed while PUBLIC_NOINDEX is on, open (with a sitemap) once it is set to false */
export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const lines = [
    '# Hello, crawler. Yes, I also read robots.txt for fun.',
    '# Humans have /humans.txt',
    '',
    'User-agent: *',
    site.noindex ? 'Disallow: /' : 'Allow: /',
  ];
  if (!site.noindex) lines.push('', `Sitemap: ${site.url}${base}/sitemap-index.xml`);
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
