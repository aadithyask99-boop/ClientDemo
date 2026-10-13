# Findings: themomentsandmemories.co.uk

Audited 2026-10-13 with (a) a live Chromium inspection on desktop (1366px) and mobile (390px), (b) [jev-seo](https://github.com/AgriciDaniel/jev-seo) v0.1.1, standard mode, (c) Lighthouse and Pa11y (axe) on the live site, and (d) the conversion/copy frameworks from [marketingskills](https://github.com/coreyhaines31/marketingskills) (`cro`, `cro/references/form.md`, `copywriting`, `offers`). Screenshots and raw reports are in `assets/`.

## Summary
An event business (kids' parties, marquees, cocktail bars, weddings) on a WordPress/Elementor site that works but is not set up to generate leads. The site does not tell Google what the business is, a visitor has no easy way to book, and nothing builds trust. Roughly 90% of the opportunity is in conversion, local SEO and content, not in technical fixes.

**Overall: 4/10.** The jev-seo score of 95/100 (A) must not be quoted to the client. It is a partial, rules-only score: it checks tags and headers, not design, content quality, rankings or PageSpeed (PageSpeed was rate-limited, 0 of 6 runs succeeded, and Jev judgments and DataForSEO were not run). It confirms the technical basics are fine and says nothing about whether the site wins customers.

## Findings
| ID | Area | Severity | Evidence | Issue | Recommended fix |
|----|------|----------|----------|-------|-----------------|
| M-01 | SEO | High | `<title>` is the bare domain on every page (jev-seo JEV-010: duplicate title elements) | Search results show "themomentsandmemories.co.uk", with no service or location keywords | Page-specific titles, e.g. "Kids Party & Marquee Hire, Borehamwood and North London \| Moments & Memories" |
| M-02 | SEO | High | No meta descriptions on 6 of 6 indexable pages (JEV-001) | Google writes its own snippet; lower click-through | Write a unique 150-160 character description per page |
| M-03 | SEO | High | No H1 on Home, Service and Contact (JEV-003); the hero headline is an H2 | Weak topical signal | One H1 per page stating service + area |
| M-04 | Local SEO | High | No LocalBusiness schema (0 JSON-LD blocks). Footer address is "124 City Road, London EC1V 2NX", while the owner is based in Borehamwood | Weak local signal; address and service area conflict. Whether she has a Google Business Profile is not yet checked | Confirm the real address or service area. Add LocalBusiness/Event service schema. Create and verify a Google Business Profile with consistent NAP |
| M-05 | Conversion | High | Phone and email are plain text, with no `tel:`, `mailto:` or WhatsApp links. The contact form is the only route. The form has no event date, event type, guest count or location fields | Mobile visitors cannot tap to call. Enquiries lack the details needed to quote | Click-to-call and WhatsApp buttons (sticky on mobile). Form fields: event type, date, guests, postcode. Add a thank-you page and conversion tracking |
| M-06 | Trust | High | No testimonials, reviews, gallery of real events, pricing or packages, FAQs or social links | Event buyers need proof before they enquire. The site relies on generic stock imagery | Add real event photos, 5-10 reviews, "from £" packages, FAQ, and links to social profiles |
| M-07 | Mobile | Medium | Page is 410px wide in a 390px viewport on the home page, so it scrolls sideways on phones | Visibly broken on mobile. Phones are likely where many enquiries start (hypothesis; check her analytics once installed) | Find and fix the overflowing element (likely an Elementor section or widget width) |
| M-08 | Visual | Medium | Hero and card images are named `Screenshot-2025-09-…png`, so they look like screenshots used as images (inferred from file names). The services cards are small, low-contrast text on a gold background. Pink, gold and orange blocks compete. Body copy is justified | Looks amateur next to the quality of the events being sold | Replace with real or licensed photography. Simplify the palette. Larger type in the services cards. Left-align body text |
| M-09 | Content | Medium | Copy says "Making Memories" in one place and "Moments & Memories" elsewhere. Contact page is 73 words. The Services page is one long block of text. Service pages are not split by service | Inconsistent brand. No page targets "bouncy castle hire", "marquee hire" or "cocktail bar hire" | One page per service and per audience (kids, adults, weddings), each with its own keyword, photos and enquiry CTA |
| M-10 | Performance | Low | Lighthouse (home): mobile performance 86 (LCP 3.8 s, FCP 2.0 s, TBT 140 ms, CLS 0), desktop 95 (LCP 1.3 s). About 54 KiB unused JS and 70 KiB unused CSS. Page weight 568 KiB mobile. 27 scripts and 37 stylesheets from Elementor, Elementor Pro, Royal Elementor Addons and Header Footer plugins. Console shows `ERR_HTTP2_PROTOCOL_ERROR` on several resources | Speed is acceptable, not a blocker. The LCP on mobile is above the 2.5 s "good" threshold, and the plugin stack is heavier than needed | Compress/resize the hero image and preload it, drop unused addons, investigate the failing resource requests with the host |
| M-11 | Technical | Medium | Sitemap lists `/?wpr_templates=user-header-header` and `/elementor-hf/header` (redirect chain, JEV-004/005). `/hello-world`, `/category/uncategorized` and the author archive are public and thin (JEV-002). Author URL exposes the account username `hazsnap2gmail-com` | Wasted crawl budget, a leaked login name, and sample content left live | `noindex`/delete template and sample pages. Change the author display name and slug. Use Yoast/Rank Math to control the sitemap |
| M-12 | Technical | Low | Missing Open Graph tags (JEV-006), canonical on 2 pages (JEV-011), favicon (JEV-009), HSTS and security headers (JEV-007/008) | Poor link previews on WhatsApp/Facebook. Minor hygiene | Install Rank Math or Yoast and add the favicon. Set security headers at the host (Hostinger) |
| M-13 | Conversion | Low | Newsletter box is on the home page with no offer. Footer reads "proudly powered by WordPress" | Low-value capture. Looks unfinished | Replace with an offer ("free party planning checklist") or remove. Remove the footer credit |
| M-14 | Accessibility | Medium | Pa11y/axe: 24 colour-contrast violations on Home, 34 on Service, 4 on Contact. White text on the gold `#c79a45` background measures 2.58:1, and gold text on white also 2.58:1 (WCAG AA needs 4.5:1, or 3:1 for large text). Lighthouse accessibility: 97 mobile, 93 desktop; no main landmark on desktop | Headings, buttons and body text are hard to read for many people, and it hurts the same visitors who book on a phone in daylight | Darken the gold (about `#8a6420` or darker) for text and buttons, or use dark text on gold. Add a `<main>` landmark |
| M-15 | Measurement | High | No analytics or tracking tags in the homepage HTML (no Google Analytics, Tag Manager, Facebook Pixel or Clarity). Technology scan 2026-10-13. All four competitors checked run analytics | Lisa cannot see which visits become enquiries or which source works, and cannot measure the effect of any change or ads | Set up Google Analytics 4, Search Console, and call, WhatsApp and form event tracking before changing the site (included in the Starter plan) |

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

---

# Conversion, copy and growth plan

Method: the `cro` skill's order of impact (value proposition, headline, CTA, visual hierarchy, trust, objections, friction), its form guidance, and the `copywriting` and `offers` skills. This site's primary goal is a **quote enquiry** (phone, WhatsApp or form). Traffic context is unknown: no analytics access, so there are no conversion-rate numbers.

**Verdict: the site describes the business but does not sell it.** A visitor must read two screens of general text to learn what is offered, and then has no fast, low-effort way to ask for a quote.

## CRO scorecard (homepage)
| Dimension | Rating | What we saw |
|---|---|---|
| Value proposition | Weak | "Celebrate Life's Moments with Style" is a mood, not an offer. It doesn't say what you hire, for whom, where, or what happens next |
| Headline | Weak | Clever, not clear (the skill says clarity beats cleverness). No service, no location, and it's an H2 rather than an H1 |
| Primary CTA | Weak | Two equal buttons ("Contact us", "Explore Our Services"). "Contact us" is a generic label. No click-to-call or WhatsApp. Form button says "Submit" |
| Visual hierarchy | Fair | Clean section rhythm, but a pink/gold/orange palette with 2.58:1 contrast, small card text, justified body copy |
| Trust and proof | Missing | No reviews, event photos, numbers, accreditation/insurance, or "as seen" proof |
| Objection handling | Missing | No prices or "from" guide, no FAQ, no availability, no "what's included", no safety/insurance statement for kids' equipment |
| Friction | High | Form-only contact, 4 fields with no event details, 180-character message limit, horizontal scroll on mobile |

## Contact form (per the form guidance)
Current fields: First name*, Email*, Phone, Message (180 characters max), "Submit".
- Keep it short, because every field costs completion, but collect what is needed to quote. Suggested: **Name\*, Phone or WhatsApp\*, Event type (dropdown), Event date, Postcode/area, Guests (optional), Message (optional)**. Make the email optional if a phone number is given.
- Remove the 180-character cap; it is too small for an event brief.
- Button: "Get my free quote". After submit: a thank-you page with "We reply within X hours" (Lisa to confirm the real promise), which also gives a clean conversion event for ads.
- Show phone and WhatsApp beside the form for people who don't want to type.

## Quick wins (this week)
1. Sticky mobile bar: **Call** and **WhatsApp**, and make the phone, email and address real `tel:`, `mailto:` and map links.
2. Hero: one primary CTA ("Get a free quote") and one quiet secondary ("See services").
3. New hero headline and sub-line (see below).
4. Add 3-5 real reviews near the first CTA (ask past clients; use Google reviews once the Business Profile exists).
5. Add a "Popular packages from £__" strip. Even a price range filters out poor-fit leads and raises trust.
6. Fix contrast (M-14), horizontal scroll (M-07), and the "Making Memories" typo (M-09).

## High-impact changes
- **Service pages that convert**: one page per service (bouncy castles/kids' parties, marquees, cocktail bars/catering, weddings and milestone events). Each gets: a clear H1, what's included, a photo gallery from real events, a "from" price, 3 FAQs, a testimonial, and one CTA.
- **Proof library**: before/after style event gallery and a short video reel (vertical, phone-shot is fine), reused on the site and social media.
- **Safety and trust block** for children's parties: insurance, safety checks, DBS or similar if applicable (confirm with Lisa before claiming anything).
- **Lead magnet** instead of the empty newsletter box: "Free party planning checklist and budget guide" (PDF), captured with name and email, followed by a 3-email nurture to a quote.
- **Local landing pages**: Borehamwood, Elstree, Barnet, St Albans and other genuine service areas, only where Lisa really serves them.

## Copy alternatives (drafts, facts for Lisa to confirm)
**Hero headline**
1. "Party, marquee and cocktail bar hire in Borehamwood and North London" (clearest; best for search)
2. "Everything for your party, delivered and set up: bouncy castles, marquees, cocktail bars" (benefit-led)
3. "Stress-free celebrations, planned and set up for you" (outcome-led; pair with a specific sub-line)

**Sub-line:** "Kids' birthdays, weddings and milestone parties. Tell us your date and guest numbers and we'll send a free quote." (If "same-day reply" is true, add it.)

**CTA labels:** "Get my free quote" (primary), "Check my date" (alternative), "WhatsApp us" (mobile). Avoid "Submit" and "Contact us".

**Section copy:** "We believe every celebration deserves to feel magical" is vague and appears word-for-word in the About and Contact text. Replace it with specifics: what you hire, how many guests, typical set-up time, and what's included.

**Do not copy** placeholder claims into the live site (numbers of events, years in business, awards) unless Lisa supplies and can evidence them.

## Offer ideas (budget-friendly, from the offers framework)
- **Fixed-price starter packages**: e.g. "Kids' party package" and "Garden party package", each with an included list and a clear "from £" figure. Lowers perceived risk and speeds the decision.
- **Risk reversal**: a date-hold ("we'll hold your date for 48 hours, no payment") if she can honour it.
- **Seasonal hook**: Christmas/NYE parties now (October), and Easter, summer and wedding-season offers later.
- **Referral**: a small credit for a client's friend's booking. Cheap, and event work is word-of-mouth.

## Growth plan for a small budget ("aggressive, but affordable")
| Phase | Focus | Output |
|---|---|---|
| Weeks 1-2 | Fix conversion basics (above) and add tracking (GA4 plus form and call events, Search Console) | A site that can turn visits into enquiries, with measurable results |
| Weeks 2-4 | Local foundation: Google Business Profile, citations, review requests, service pages | Appear for "party hire near me" type searches |
| Weeks 4-8 | Content and social: event reels, gallery, 2 short posts a month per service | Proof and traffic that cost time rather than money |
| Month 2+ | Small paid test (about £150-300/month): Google Search for "[service] + area", plus Meta retargeting for site visitors | Cost per enquiry measured, then scaled or stopped |
| Ongoing | Monthly review: enquiries, cost per lead, conversion rate | Decide what to double down on |

**Metrics to agree up front:** enquiries per month (form, call and WhatsApp), cost per enquiry, enquiry-to-booking rate, and review count. Baseline them before changing anything.

## Test ideas (once there is traffic)
Hero headline A vs B, "Get my free quote" vs "Check my date", form with and without a date field, packages with prices vs "enquire for price". The `ab-testing` skill is the guide, but with low traffic fix the obvious problems first rather than test.

## Tool results (raw files in `assets/`)
| Tool | Result | File |
|---|---|---|
| Lighthouse mobile (home) | Performance 86, Accessibility 97, Best practices 96, SEO 92 | `assets/lighthouse/mobile.report.html` |
| Lighthouse desktop (home) | Performance 95, Accessibility 93, Best practices 96, SEO 92 | `assets/lighthouse/desktop.report.html` |
| Pa11y (axe) | 24 / 34 / 4 contrast violations on Home / Service / Contact, nothing else | `assets/pa11y/*.json` |
| jev-seo | 95/100 partial, 11 rules-only actions | `assets/jev-seo-report.pdf` |
