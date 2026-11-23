# UK Thech homepage: decisions (single source of truth for every helper)

Folder `ukthech/`, branch `claude/funny-bohr-47vcsq`, Astro + GSAP + Lenis, plain CSS, static. Plan and reasoning: `.claude/skills/design-craft/references/clients/uk-thech.md`. Read `.claude/skills/design-craft/references/owner-taste.md` and the hard rules in `.claude/skills/design-craft/SKILL.md` section 4 before touching anything.

## Mode and reference
Replicate-and-extend of the homepage of https://108.supply/ (the owner approved it for this client). Study captures: `/home/user/ClientDemo/captures/108supply/` (desktop strips, scroll sheet, report.md) and hand screenshots in the session scratchpad `study/s108/`. Two borrowed moments from primeasialeather.com: the card hover that swaps the picture for a close-up, and the cursor-lit footer. Owner approved the plan ("go", fine with all recommendations).

## Client and goal
UK B2B supplier of laptops and hardware to schools, NHS and councils, hospitality, property. Sells by quote, no catalogue. Must look premium and trustworthy, not like an eBay or Amazon reseller. Needs from a buyer: what product, how many, by when. Education is Chromebook-heavy. Brand is being renamed: use the working wordmark "UK Thech" in `src/data/site.ts` as a clearly labelled placeholder. All content lives in `src/data/site.ts`.

## Palette (owner chose C, graphite and blue)
ground `#16181b`, paper `#f2f0eb`, blue `#4663ff` (fills and big type; white label on blue buttons, 4.68:1), blue tint `#9db0ff` for small links on dark (8.5:1), white `#ffffff`. Navy is not used. No gold, no gradients except real light (a sunbeam, a lamp glow), no hairlines.

## Type (owner chose Host Grotesk)
`@fontsource-variable/host-grotesk`, self-hosted, one family. Headlines weight 400, letter-spacing -0.035em, second line of a headline dimmed to 50 percent; buttons weight 500; body 400. Scale from 108: 86, 56, 48, 35, 20, 16 px. No mono labels, no italics, no em dashes in copy, no small labels above titles.

## Rhythm, easing, motion
Page grounds: hero dark, 2 paper, 3 graphite with white panel, 4 paper, 5 graphite with white pinned panel, 6 dark full-bleed scene, 7 graphite footer (about 40 percent paper). Hovers 0.3 s `cubic-bezier(0.32, 0.72, 0, 1)`. Lenis smooth scroll on desktop pointers only. Motion target: at least 70 percent of the reference's 165 scroll-moving elements (about 115) and no section without motion; verify with `scripts/motion-probe.mjs <build> --vs https://108.supply/`. `prefers-reduced-motion` honoured, readable without JavaScript.

## Sections (order, all content in the data file)
0 Loader: wordmark on dark, 1 s, skippable, skipped on repeat visits.
1 Hero: inset 8 px film with rounded corners over the dark page; four places (school corridor, ward reception, council counter, hotel front desk); headline "Tech for" fixed, second line dimmed and swaps Schools / Hospitals / Councils / Hotels every 5.3 s with a crossfade; four thumbnails bottom-left, the active one has a progress bar, press to jump; floating pill nav (logo pill, links Education, Public sector, Hospitality, Property, How it works; a direct-number pill and a blue Get a quote pill); hovering a link turns its pill white and opens a frosted mega-menu (list left, live preview right); pills go light over paper sections; the scene responds to the cursor (beam and foreground shift, soft light follows it). Get a quote opens the quote sentence in a frosted sheet from anywhere.
2 Statement (paper): one 86 px sentence over three lines, the four sectors set inline as words with an accent underline; words brighten with scroll scrub.
3 What schools buy first (graphite with one white rounded panel): Chromebook image full height, trolley and tablets as two unequal pieces beside it; drag; hover swaps the still for a close-up.
4 The quote sentence (paper, the centrepiece): "I need [Chromebooks] [30] by [September]" as one huge sentence with big tappable choices and a blue send button; object stills drift round it with pointer and scroll. A real form (validates, no backend: shows a confirmation and mailto fallback).
5 Order arrives (graphite, white pinned panel): scrubbed scene of a parcel opening on a desk and the pack lifting out; the only pinned scene; no legible text on any document.
6 Promise (dark full-bleed scene): "Send us the quote you hold. We will try to beat it." A physical in-tray on the desk; a desk lamp warms and its light spills as a file nears; the drop zone is real (file input) but styled as the in-tray, not a dashed box.
7 Footer (graphite): named person and direct number set very large beside the cursor-lit wordmark; sectors and contact below.

## Easter eggs (build all three, lazy-loaded, touch equivalents)
1. Type "chromebook" (touch: long-press the Chromebook panel): a charging trolley rolls across the bottom, laptops light one by one, it rolls out.
2. Hover the send button for two seconds, or on sending a quote: a rubber stamp slams "RECEIVED" (sound only on a deliberate tap, low volume).
3. Keep scrolling at the very bottom (touch: overscroll): a van (a generated still, cut out, not a vector) crosses and leaves a parcel by the wordmark. At most one subtle hint cue per visit.

## Owner's likes and dislikes (quoted from owner-taste.md)
Likes: a hero that is a scene or living subject; the cursor or scroll changing the scene; film or cinematic backgrounds with very little UI; physical smooth motion and surprises; two quiet colours plus one loud accent; a first screen with one strong subject. Hard passes: boxy rows of same-size cards, decorative gradients, small labels above sections, hairline rows or rules, heavy headline walls, gold, filler sections (a small sentence in empty space, a heading plus a list, plain boxes), pixelated or low-bitrate media, duplicated images, a double navigation, a page that looks like another site's template.

## Media rules
Full-width video at least 1920x1080 at 3 to 4 Mbps (720p is NOT allowed full-width); photographs at least as wide as they are drawn, ideally 2x (2880 px full-bleed), WebP quality 80 or better; `scripts/media-quality.mjs` must be clean. One master look for every generated frame: warm late-afternoon low sun from camera left, a soft beam across the scene, muted laminate and pale wood, off-white and graphite objects, shallow depth, no people, no logos, no legible text. No faces, no children, no NHS marks or uniforms, no real brand marks on devices, no fake accreditations. Generation: `NODE_USE_ENV_PROXY=1 node .claude/skills/design-craft/scripts/gen-media.mjs <jobs.json> --out ukthech/generated --budget 2` (Node's fetch needs that variable behind the proxy). Budget cap $2. Status: OpenRouter requires at least $1 account balance for image and video; the account currently has none, so media is pending credit.

## B2B rules
Quote reachable from every screen (the sheet), direct number visible in the nav and footer, loader skippable, posters load first and film after, quote form usable before media loads, phones get posters, the sentence form first and one pin fewer. Anything the client has not confirmed (reply time, credit terms, named person, brands supplied, recycling partner, address) is a visible placeholder labelled "to confirm" in the data file and listed in the README, never shown as fact.

## Done means (skill section 10)
Built; Impeccable run (`.claude/skills/impeccable/scripts/impeccable detect` then critique and audit) with real findings fixed; `references/checklist.md` on 1440 and 390 screenshots; motion-probe vs 108 (at least 70 percent, no dead section); media-quality, detail-audit clean; compare-sheets at least two rounds; owner-critic on the build until ship (max three rounds); published as an artifact (title "UK Thech homepage (concept)", private); feedback.md entry, fingerprints row, case study; committed and pushed to the branch, no pull request.
