# EVM homepage: design system, content inventory and section map (section 11, two jobs)

Reference: esrbespoke.au, measured on 2026-11-02 from full-size frames (intro at 5 fps), strips at 1440 and 390, and computed styles. Content source: evmgroup.co.in (pages, and its public data endpoints under `/api/`, plus the contact blocks in its script bundle). Fetched through a certificate workaround the owner approved for their client.

## 1. ESR design system (the vocabulary for every section)
- **Colour:** #000, #fff, #191919 hairlines and panels, #e6e6e6 for inactive list text on white, #787776 for muted labels. No accent colour at all.
- **Grid:** 32px gutter at 1440. Three columns start at x=32, x=380 (26%), x=960 (67%); the right column is 448px wide. Everything hangs off these lines.
- **Type:** body grotesk weight 500. Statement 40px/40px, tracking -0.4px. Roller names 92px/87px, tracking -0.92px. Row text 20px/24px. Hero headline about 62px. Labels 14px, weight 300, 1.26px tracking, uppercase (the owner rejected uppercase: ours are sentence case, same size and place).
- **Image treatment:** edge-to-edge photographs about 735px tall; one 216px square tile for the active item; film graded dark; no thumbnails rows, no cards, no rounded corners (buttons 2px).
- **Motion:** smooth scroll; intro with typed labels, a wordmark rising in slices, then the film; typed headline and links; the active roller item turns from pale to full colour as it crosses the middle of the screen; tile swaps with a short fade. Nothing parallax, nothing scrubbed.
- **Section patterns:** P1 film hero; P2 label plus one 40px paragraph; P3 full-bleed photograph; P4 roller list with sticky tile; P5 40px paragraph plus numbered hairline rows in the right column; P6 white gap with a label; P7 footer on the grid with a black wordmark.

## 2. Content inventory (EVM, current site)
| Block | What the site has | Matters |
| --- | --- | --- |
| About | Group overview; founder named after E.V. Mathai; 1952 toddy shop story; family of nine children | high |
| Numbers | 68 years of experience, 12 lakh satisfied customers (2020 figures) | medium |
| Marques | Automobile dealerships: Porsche, BMW, MINI, Volkswagen, Isuzu, Skoda, Nissan, Datsun, BMW Motorrad, Ashok Leyland, Honda, Indian; MG through Coastline Garages; Ducati, Polaris, Scania in the history. Descriptions for Porsche, BMW, MINI, Isuzu, Skoda, BMW Motorrad, Indian | high |
| Sectors | Automobile; Hotels and resorts (Mountain Club Munnar, Le Leela boutique resort); Plantation; Transportation (EVM Super Transportation, EVM Wheels self drive); Entertainment (EVM Cinemas) | high |
| Mission and vision | One mission paragraph, five vision lines | high |
| History | 27 dated entries 1952 to 2019 | high |
| Messages | Chairman's message and Managing Director's message (excerpts) | high |
| People | Four directors; five top management | high |
| Recognition | Five achievement paragraphs; All India No.1 Dealer award 2012-2013; Dealer of the Year 2014 (Ashok Leyland) and 2018 (Honda) | high |
| Testimonials | 11 customers (BMW, MINI, MG Hector) | high |
| Contact | Corporate office (E.V.M Motors and Vehicles India Pvt Ltd, Maradu, Cochin, 0484 404040, corporateoffice@evmgroup.co.in); EVM Wheels (Edappally, +91 7902530000, support@evmwheels.com); EVM Honda Trivandrum (98957 59493, gmtvm@evmhonda.com); a contact form | high |
| Careers | A form with resume upload | medium |
| Footer | Our Business links, menu, copyright | medium |

## 3. Section map
| # | Content block | Reference counterpart or new | Pattern and notes |
| --- | --- | --- | --- |
| 1 | Brand, tagline | counterpart: intro and film hero | P1. Same intro sequence and nav. |
| 2 | About, numbers | counterpart: statement | P2. Label, 40px paragraph, then two 92px figures on the grid. |
| 3 | Showroom image | counterpart: photograph | P3. |
| 4 | Marques (13) | counterpart: marques roller | P4. Sticky 216px tile and caption from the dealership text. |
| 5 | Sectors | counterpart: services rows | P5, black. Numbered rows; hovering a row shows a tile in column two. |
| 6 | Mission and vision | new, from P2 | White. Two labelled 40px blocks; the vision is five 40px lines. |
| 7 | History | new "chronicle" | Black. Left column: a sticky 92px decade that turns from pale to full as you scroll. Right column: dated rows in the P5 row style (year as the 14px label, text 20px). |
| 8 | Chairman and MD messages | new "letters" | White. Column one label, column two the opening line at 40px, column three the body at 16px. |
| 9 | Directors, top management | new, from P4 | Black. Roller of nine names with a sticky tile (placeholder portrait) and the role as caption. |
| 10 | Recognition | new, from P5 | White. Rows: column one the brand or award, column three the text. |
| 11 | Testimonials (11) | new "reader" | Black. Left: sticky list of names in the 20px row style. Right: the active customer's quote at 40px, changing as the page scrolls. |
| 12 | Contact, careers | new, from the footer sign-up field | White. Underlined fields in the sign-up style, three office blocks as labels. |
| 13 | Footer | counterpart: footer | P7. Wordmark in black, Our Business list, menu, legal. |

Rules check: no neighbouring sections share a layout; P2 twice (2, 6), P4 twice (4, 9), P5 twice (5, 10), every other layout once.

## 4. Cuts and why (also in the handover)
- Duplicate slides: testimonials, awards, directors and top management each appear two or three times in the old markup.
- Sector "EUROREPAR": the data has no brands, text or image.
- Brand descriptions that are test filler ("sdsdsa...") for VW, Nissan, Datsun, Ashok Leyland, Honda; their captions use the dated history lines instead.
- The old site's counters and the "68 years" line: kept, labelled as the old site's 2020 figures.
- Typos fixed (Inorder, comittment, viablity, enterprenurial).
- Chairman's message says "established in 1957"; the group's own history says 1952. Kept as the client's words and flagged in the README for the client to resolve.
- Messages are excerpts: the old site truncates them behind "Read more" and the full text is not in the public data.
