# Findings: themomentsandmemories.co.uk

Audited 2026-10-13 with (a) a live Chromium inspection on desktop (1366px) and mobile (390px), and (b) [jev-seo](https://github.com/AgriciDaniel/jev-seo) v0.1.1, standard mode. Screenshots are in `assets/`.

## Summary
An event business (kids' parties, marquees, cocktail bars, weddings) on a WordPress/Elementor site that works but is not set up to generate leads. The site does not tell Google what the business is, a visitor has no easy way to book, and nothing builds trust. Roughly 90% of the opportunity is in conversion, local SEO and content, not in technical fixes.

**Overall: 4/10.** The jev-seo score of 95/100 (A) must not be quoted to the client. It is a partial, rules-only score: it checks tags and headers, not design, content quality, rankings or PageSpeed (PageSpeed was rate-limited, 0 of 6 runs succeeded, and Jev judgments and DataForSEO were not run). It confirms the technical basics are fine and says nothing about whether the site wins customers.

## Findings
| ID | Area | Severity | Evidence | Issue | Recommended fix |
|----|------|----------|----------|-------|-----------------|
| M-01 | SEO | High | `<title>` is the bare domain on every page (jev-seo JEV-010: duplicate title elements) | Search results show "themomentsandmemories.co.uk", with no service or location keywords | Page-specific titles, e.g. "Kids Party & Marquee Hire, Borehamwood and North London \| Moments & Memories" |
| M-02 | SEO | High | No meta descriptions on 6 of 6 indexable pages (JEV-001) | Google writes its own snippet; lower click-through | Write a unique 150-160 character description per page |
| M-03 | SEO | High | No H1 on Home, Service and Contact (JEV-003); the hero headline is an H2 | Weak topical signal | One H1 per page stating service + area |
| M-04 | Local SEO | High | No LocalBusiness schema (0 JSON-LD blocks). Footer address is "124 City Road, London EC1V 2NX", while the owner is based in Borehamwood | No local signal; address and service area conflict. Cannot rank in the map pack | Confirm the real address or service area. Add LocalBusiness/Event service schema. Create and verify a Google Business Profile with consistent NAP |
| M-05 | Conversion | High | Phone and email are plain text, with no `tel:`, `mailto:` or WhatsApp links. The contact form is the only route. The form has no event date, event type, guest count or location fields | Mobile visitors cannot tap to call. Enquiries lack the details needed to quote | Click-to-call and WhatsApp buttons (sticky on mobile). Form fields: event type, date, guests, postcode. Add a thank-you page and conversion tracking |
| M-06 | Trust | High | No testimonials, reviews, gallery of real events, pricing or packages, FAQs or social links | Event buyers need proof before they enquire. The site relies on generic stock imagery | Add real event photos, 5-10 reviews, "from £" packages, FAQ, and links to social profiles |
| M-07 | Mobile | Medium | Page is 410px wide in a 390px viewport on the home page, so it scrolls sideways on phones | Visibly broken on mobile, where most event enquiries come from | Find and fix the overflowing element (likely an Elementor section or widget width) |
| M-08 | Visual | Medium | Hero and card images are named `Screenshot-2025-09-…png`, so they are screenshots used as images. The services cards are small, low-contrast text on a gold background. Pink, gold and orange blocks compete. Body copy is justified | Looks amateur next to the quality of the events being sold | Replace with real or licensed photography. Simplify the palette. Larger type in the services cards. Left-align body text |
| M-09 | Content | Medium | Copy says "Making Memories" in one place and "Moments & Memories" elsewhere. Contact page is 73 words. The Services page is one long block of text. Service pages are not split by service | Inconsistent brand. No page targets "bouncy castle hire", "marquee hire" or "cocktail bar hire" | One page per service and per audience (kids, adults, weddings), each with its own keyword, photos and enquiry CTA |
| M-10 | Technical | Medium | Home page makes about 69 requests (~950 KB), and loads 27 scripts and 37 stylesheets from Elementor, Elementor Pro, Royal Elementor Addons and Header Footer plugins. Heavy images (1000px+ PNGs) | Slower on mobile data | Remove unused addons, convert images to WebP at display size, enable caching/minification. Re-measure with PageSpeed (not completed in this audit) |
| M-11 | Technical | Medium | Sitemap lists `/?wpr_templates=user-header-header` and `/elementor-hf/header` (redirect chain, JEV-004/005). `/hello-world`, `/category/uncategorized` and the author archive are public and thin (JEV-002). Author URL exposes the account username `hazsnap2gmail-com` | Wasted crawl budget, a leaked login name, and sample content left live | `noindex`/delete template and sample pages. Change the author display name and slug. Use Yoast/Rank Math to control the sitemap |
| M-12 | Technical | Low | Missing Open Graph tags (JEV-006), canonical on 2 pages (JEV-011), favicon (JEV-009), HSTS and security headers (JEV-007/008) | Poor link previews on WhatsApp/Facebook. Minor hygiene | Install Rank Math or Yoast and add the favicon. Set security headers at the host (Hostinger) |
| M-13 | Conversion | Low | Newsletter box is on the home page with no offer. Footer reads "proudly powered by WordPress" | Low-value capture. Looks unfinished | Replace with an offer ("free party planning checklist") or remove. Remove the footer credit |

## Quick wins (about one day)
M-01, M-02, M-03, M-05 (tap-to-call, WhatsApp), M-07, M-11 (hide sample pages), M-12 (favicon, OG tags).

## Not assessed (needs data or access)
Rankings, keyword demand, competitors and backlinks (jev-seo `--full` with DataForSEO), PageSpeed/Core Web Vitals (rate-limited, retry with an API key), Google Business Profile status, social channels, and whether the contact form actually delivers email.

## Next steps
1. **Week 1: quick wins.** Titles, descriptions, H1s, tap-to-call and WhatsApp, mobile overflow, hide sample pages, favicon.
2. **Weeks 2-3: foundation.** Google Business Profile, LocalBusiness schema, one page per service, real photos, reviews, packages.
3. **Weeks 4-8: lead gen.** Local landing pages (Borehamwood, Barnet, Hertfordshire), Google Business posts and review requests, a small Meta/Google Ads test budget on the highest-intent services, with call and form tracking.

## Fit for the pitch
Strong fit if sold as a fixed-fee "fix the foundation, then grow" project. Her budget rules out a retainer, so the first phase should be scoped and priced separately. Confirm the real address, budget, goals (parties vs weddings vs hire) and current enquiry volume before quoting.
