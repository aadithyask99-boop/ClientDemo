# EVM homepage: design system, curated content and section map (section 11)

Reference: esrbespoke.au, measured on 2026-11-02 (intro at 5 fps, strips at 1440 and 390, computed styles). Content source: evmgroup.co.in (pages, public data endpoints, contact blocks in its script bundle), read to understand the client and held in `evm/src/data/archive.ts`. The homepage is a highlight reel: it shows one short moment per kind of content and links to the rest.

## 1. ESR design system (what the homepage copies)
- **Colour:** #000, #fff, #191919 hairlines, #e6e6e6 inactive list text on white, #787776 muted labels. No accent.
- **Grid:** 32px gutter at 1440; columns start at x=32, 380 (26%) and 960 (67%).
- **Type:** weight 500 grotesk. Statement 40px/40px; roller names 92px; row text 20px/24px; headline about 62px. Labels 14px (sentence case here by the owner's rule; the reference uses uppercase).
- **Image treatment:** edge-to-edge photographs about 735px tall; one 216px square tile for the active roller item; film graded dark; 2px corners only.
- **Motion:** smooth scroll; intro with typed labels, a wordmark rising in slices, then the film; typed headline and links; the roller item nearest the middle turns from pale to full colour; tile swaps with a short fade.
- **Section patterns:** P1 film hero; P2 label plus one 40px paragraph; P3 full-bleed photograph; P4 roller with sticky tile; P5 40px paragraph plus numbered rows in the right column; P7 footer on the grid with a black wordmark.

## 2. Size targets (measured by `compare-sheets.py`)
ESR: 6,870 px, 319 words, 7 sections. Limits: 10,305 px, 957 words, 10 sections. EVM build: **9,044 px (1.3x), 314 words (1.0x), 9 sections**, no warnings.

## 3. Section map: one moment per kind of content
| # | Content kind | Moment on the homepage | Reference counterpart or new | Pattern |
| --- | --- | --- | --- | --- |
| 1 | Brand | Intro, film, headline "Future is our Business" | counterpart | P1 |
| 2 | Story and people | Two sentences: 1952 toddy shop, Porsche, BMW, MINI, led by E.M. Johny and Sabu Johny. Links: Our story, Our people | counterpart | P2 |
| 3 | Brands (image) | Showroom photograph | counterpart | P3 |
| 4 | Brands | Eight marques, one line each, tile follows. Link: All marques | counterpart | P4 |
| 5 | Sectors | One line, then five sector names in numbered rows with a tile on hover. Link: All sectors | counterpart | P5, black |
| 6 | Sectors (image) | Plantation photograph | counterpart | P3 (second use) |
| 7 | History | Four dates (1952, 1985, 2013, 2019) at roller size, one line each. Link: Full history | new | static big list, caption column |
| 8 | Testimonials, awards | One customer quote at statement size, three recognition rows. Links: More reviews, All recognition | new, from P5 | P5 (second use), black |
| 9 | Careers | One line, links: Careers, Our people | new, from P2 | P2 (second use) |
| 10 | Contact | Footer: corporate office only, black wordmark, menu | counterpart | P7 |

No neighbouring sections share a layout; P2, P3 and P5 are each used twice, every other layout once.

## 4. Cut or moved, and where it lives
Everything below is kept in `evm/src/data/archive.ts` and belongs on the linked page (links on the homepage point at these routes; the pages are not built yet).
| Content | Where it goes |
| --- | --- |
| Mission and vision, Chairman's and MD's messages, 68 years and 12 lakh customers | `/about` |
| Four directors and five top management, portraits | `/people` |
| 23 history rows 1952 to 2019 | `/history` |
| Five more marques (Isuzu, Datsun, BMW Motorrad, Indian, Ashok Leyland) and every marque's long description | `/marques` and `/marques/<name>` |
| Sector descriptions: Mountain Club Munnar, Le Leela, EVM Plantation, EVM Super Transportation, EVM Wheels, EVM Cinemas | `/sectors` and `/sectors/<name>` |
| Six achievement paragraphs and three awards | `/recognition` |
| Ten more testimonials | `/reviews` |
| Two more offices (EVM Wheels, EVM Honda Trivandrum), contact form, careers form with resume | `/contact`, `/careers` |
Dropped for good: duplicate slides, the sector EUROREPAR (no content), test-filler brand text, the old site's typos.
