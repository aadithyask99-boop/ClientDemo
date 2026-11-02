# EVM Group (evmgroup.co.in): as-is audit

Mode: improve an existing site (section 9). Pages reviewed: `/` and `/about-us`. Captured 2026-11-02 from the cloud session. The owner confirmed it is their client's site and that the SSL problem is known.

## How the capture was done (read before repeating)

- The origin certificate is **expired**, so the session's egress proxy refuses it (`upstream request failed`, 502) and `curl` fails with error 60. The owner authorised working around this for this client only.
- Working method: `curl -k` can fetch files; a Playwright script routed every `evmgroup.co.in` request through `curl -k` and let other hosts load normally. The script lives in the session scratchpad, not in the repo. Captures are in `captures/evm/` (git-ignored).
- The site is an **Angular SPA** (2021 build). `/about-us` returns 404 from the server unless the SPA shell is served, so deep links only work through the app's own routing. Plain `http://` returns a "Please wait while your request is being verified..." page that blocks headless browsers; the HTTPS origin does not.
- Phone captures failed (page timed out on one slow upload image and a Zone.js error); redo them.

## Design language today

- **Type:** Gelion (Regular and Semi), a geometric sans, for everything. The only other face is the red italic serif "EVM" logo. No type contrast beyond size.
- **Colour:** white and pale cyan blocks, pale blue-grey offset rectangles behind portraits, one saturated blue for links and arrows, dark grey footer. Photography brings the colour (a cyan Porsche, an orange MINI, red cars).
- **Imagery:** manufacturer press photography per brand, fine and glossy. Director portraits are low resolution and inconsistent (different backgrounds, sizes, crops). Stock photos for mission and vision (dartboard, puzzle).
- **Motion:** AOS fade-ins, Owl Carousel sliders (history, dealers, awards, testimonials), jQuery and GSAP in the bundle.
- **Tone:** formal, corporate, translated feel ("Inorder", "comittment", "viablity" typos in the copy).

## Homepage structure (top to bottom)

1. Header: red italic EVM logo, nav (Home, About, Sectors dropdown, Career, Contact).
2. First screen: full-bleed photo of a blue Porsche 911, **no headline, no call to action**.
3. About summary: long paragraph, "View more".
4. Counters: 68 years of experience, 12 lakh satisfied customers.
5. Our History: horizontal slider of year cards (2019 back to 1975), "Full View".
6. We are Dealers For: full-bleed brand slider (Porsche, BMW, MINI, VW, Isuzu, Skoda, Nissan, Datsun, BMW Motorad, Ashok Leyland, Honda, Indian, Cinemas, Plantation, Transportation) with small white labels over photos.
7. Our Directors: four portraits on a pale band.
8. Achievements and Awards: slider, plus gold laurel badges.
9. Testimonials: slider with portrait, grey box, blue arrows.
10. Our Business links, footer (4 columns, "Copyright 2020").

## About page structure

About Us hero (text left, MINI photo right with a blue block overlapping the image), founder story, Chairman and MD messages, Our Mission and Our Vision (stock photos on blue-grey offsets), Our Directors, Top Management, footer.

## What works (keep)

- A real, long story: 1952 founding, toddy shop auctioned at 15, nine children, the brothers as a team, a dated timeline from 1975 to 2019. This is the strongest asset and the site buries it in a card slider.
- Brand dealerships that carry weight: Porsche, BMW, MINI, Skoda, Honda, Nissan, MG.
- Awards with specifics (Honda Elite Club of Wing World Dealers, DCSI rank 1 in South India, Nissan 20,000 units).
- Photography of the cars themselves.
- Clear navigation labels and the "Future is our Business" line.

## What is generic or broken (checklist against screenshots)

- **First screen has no headline, no message, no call to action.** A car with a logo bar. The visitor cannot tell it is a group of 15+ businesses.
- **Rows of same-size cards and sliders everywhere**: history, brands, awards, testimonials all hide content behind arrows and dots.
- **Duplicated content:** the awards slider repeats the same slides, testimonials appear three times in the HTML, the directors block is on both pages, and "About Us" appears twice in the footer.
- **History slider cuts text mid-sentence** (cards clip the copy and the next card overlaps).
- **Footer says Copyright 2020**, unlabelled counters, "Dealers For" labels white on bright photos (low contrast).
- **Blue overlay block on the About hero** covers part of the car photo and reads as a rendering bug.
- **Director portraits** are mismatched in size, resolution and background. "Our Directors" label sits beside the images, not above.
- **Testimonials**: grey box on white, arrows in two different blues, no brand or location context beyond a model name.
- **Copy typos:** Inorder, comittment, viablity, "His wife, loving wife", "Cochin,Trichur,Calicut" spacing, "Mr Jithin".
- **Content wall:** the full founder story is a single unbroken paragraph on the homepage.
- **Tech:** Angular SPA from 2021 with 826 KB main bundle, 360 KB styles and 330 KB scripts (jQuery, Owl, GSAP, AOS), Google Maps loaded on every page with an API key in the HTML (the key should be restricted by referrer; tell the client). Content is rendered by the client, so search engines and link previews get an empty shell. Deep links 404 on the server.
- **SSL expired**, so browsers show a full-page warning. This is the first thing every visitor sees and must be fixed before any redesign matters.

## SEO basics to preserve

- Only `<title>Evm Group</title>` in the shell, no meta description, no h1 in the server HTML. Everything is client-rendered, so a rebuild as static HTML is a clear SEO gain.
- URLs to keep: `/`, `/about-us`, plus the Sectors, Career and Contact routes (confirm the full list before launch).
- Structured data: none found.

## Not yet done

- Phone capture (390 wide), speed numbers, scroll recording, Impeccable URL scan (blocked by the same certificate issue), Sectors, Career and Contact pages.
- Owner questions: what does the client dislike or want more of, is there a reference site, must the site stay Angular or may it be rebuilt in Astro as a separate demo, which brands may use their logos, is real photography available beyond manufacturer press images.
