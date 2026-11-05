# kerala3: what keralatourism.org has that kerala3 is missing

Read from the live home page in a headless browser (scrolled fully so lazy sections load; 12,772 px tall at 1440). Capture: `captures/keralatourism` (not committed).

## What the real home page shows, in order
1. Hero film with four tabs: Hills, Waterfalls, Backwaters, Beaches
2. **What's New**: press stories (WTM London, Keralame music, Brand Wayanad, Champions Boat League, Destination Wedding)
3. **Kerala's Stunning Wonders**: three tall cards: Religious Heritage, Malabar's Attractions, Wellness Retreats
4. **Memories for a Lifetime**: dark film band and a sideways carousel: Village Life, Trekking and Safaris, Agri Tourism, Cuisine, Artforms, Monsoon, Houseboat
5. **Events**: dated festivals (Beemapally Uroos 11 Nov, Kalpathi Ratholsavam 14 Nov, Guruvayur Ekadasi 21 Nov)
6. **Gateway to Kerala**: one featured place story (Areekkal and Kochareekkal)
7. **Popular Destinations**: Thattekkad, Bekal, Periyar, Kumarakom, Athirappilly, Munnar, Kovalam, Kavvayi
8. **E-Brochures**: digital guides (Wayanad shown)
9. **Hospitality Services**: Where to stay (Yathri Nivas / Eco Lodges, Tourist Information Centers) and Find a tour operator (Travel Care, Tour Guide)
10. **Latest News**: tenders and notices
11. **Photo Gallery**
12. **Video Gallery**
13. **Connect with us**: social feeds, then partner bodies (BRDC, DTPC, KATPS, KITTS)
14. Footer: Explore, Travel Hub, Nature, Places, Specialities, Media

## Against kerala3's ten sections
Already there, so not proposed: hero film and the four-tab idea (our hero cycles the places), Memories for a Lifetime (our dark "heart of Kerala is its people" and the sideways scroll), Gateway (stays and off the well-trodden path), Popular Destinations as a section (our pinned fan; only the list differs), What's New and Latest News (press releases and tenders are not visitor content), Connect with us (blank social embeds; goes in the footer), partner bodies (footer links).

## Required steps, with evidence
- Browser capture of keralatourism.org: done (above, `captures/keralatourism` not committed).
- Motion inventory of the official page: done in a browser. The page has almost no scroll motion: a hero film, auto-advancing carousels (What's New, Memories, Events, Photo Gallery), tab switches in Hospitality, lazy-loaded cards. So the motion here is ours to design, in Red Dot's language (slow blur-to-clear lines, scrub, pointer depth).
- motionsites lookup: done with `motionsites-shortlist.mjs`. Frames of eight previews in `proposal-reference-sheet.png`: Infinite Gallery, Runway Lookbook, Mostar Guide, Travel Journal, Tana Elephant, Saffron Field, Frostbound, and Way Farer (looked at and rejected: a floating booking card over an illustration is a widget). Mechanisms are cited per idea below. Stills do not show scroll behaviour; I read the mechanism from the frame pairs and the gallery titles.
- Palette: the new scenes use the page's own palette. I recommend A unless you object. Others: (A) current, paper `#f4f3ef` and cocoa `#2c2623` with Kerala green `#12803a` / `#2fc25f` (recommended); (B) forest night, forest-black `#14281d` with green `#3fcf6e`; (C) paper and cocoa with a deep lagoon teal `#0f6b73` as the accent. Easter eggs: the four built ones stay; the lamps in After dark light up when you click them.
- Critic log: round 1 said fix (Four welcomes thin, wall sizes, leaflet gimmick risk, Events unrequested, palette and log missing). Changes below. Round 2 said fix (small): show five previews in the message, name the films, say whether the leaflet is rendered, name real towns, put the capture in the message. All done below.
- Capture evidence: the page strips are in `captures-keralatourism-strip.png` (committed).

## Repetition audit (owner: repeated sections are a no-go)
Existing mechanisms in kerala3: hero film (footage drifts with the cursor), pinned fan stepped by scroll, pinned months wipe, sideways headline (heart), frame grows to full bleed (water), three tall photographs rising, mosaic with hover reveal (trips), centred carousel (stays), footer word. Each addition below says which of these it must not repeat and what is different. Dropped for repeating: the pinned "Four welcomes" (fan and months), the standalone Events section (a full-bleed photograph with huge type is Water and months), the leaflet's grow-to-full-bleed (Water), the film title list and slanted cut (months list, hero).

## Four additions, ranked, one recommendation each. Every item you named has a scene.

### 1. Popular Destinations: a drifting wall (after Stays)
- **Visitor sees:** a dark full-bleed wall of eight photographs: one very large, two medium, five small, overlapping at the edges and off-grid (Thattekkad bird, Bekal fort, Periyar tiger, Kumarakom, Athirappilly, Munnar, Kovalam, Kavvayi). Scrolling drifts the wall diagonally in layers at different speeds, like a camera over a table; the photograph nearest the screen centre sharpens, the rest soften, and its name is set huge with its best months. Click opens the official page. Phones: the same, by scroll. It is dark where Trips is light.
- **Not a repeat of:** the fan (seven flagships stepped by scroll) or Trips (equal-ish mosaic with hover): this is the only place you wander instead of scroll, with depth blur and very unequal sizes.
- **Precedent:** Infinite Gallery, Runway Lookbook.

### 2. E-Brochures: a leaflet that opens on a table (after the wall)
- **Visitor sees:** no object and no render. A Wayanad cover photograph with its title, on warm paper. Scrolling splits it down the centre fold and the two halves swing open like pages (a simple 3D hinge on the photograph itself) to a double-page photograph spread, which holds and does not grow. The Munnar and Kumarakom covers slide in over it in turn. One green pill offers the download.
- **Not a repeat of:** Water's grow-to-full-bleed (it never fills the screen) or the carousel (three moments of one unfold, not a row).
- **Precedent:** Runway Lookbook, Travel Journal. Risk: the hinge must look like real pages; if it does not, I cut the section and fold the download into the closing.

### 3. Video Gallery: a cinema whose light spills onto the page (after the leaflet)
- **Visitor sees:** a large framed film on a section that turns dark, with a blurred copy of the clip filling the background so its colours spill onto the page. The five films play in sequence by themselves, no title list: The night the god walks (Theyyam), Snake boats on the Punnamada, Eight hours to a face (Kathakali), Before the clouds come down (tea, Munnar), Nets at dusk (Fort Kochi). Tap the frame to skip; sound off until tapped. It needs real footage. If none arrives, this is the section to drop, not to fake with stills.
- **Not a repeat of:** the hero (timed full-bleed film with the slice cut; this is a framed film in a glowing room) or the months list (no list, no wipe).
- **Precedent:** Mostar Guide, Frostbound.

### 4. Hospitality Services: a lane at dusk (before the close)
- **Visitor sees:** one wide photograph of a Kerala village lane at warm dusk (amber and rose sky, not near-black), lit windows and doorways. A slow ambient dusk cycle deepens the light by itself; the pointer is optional. Four doorways are the four services. Hover or tap a doorway (touch and no-pointer visitors get them in turn automatically): the light in it warms, the lane dims around it and one practical line opens beside it. Where to stay (Yathri Nivas eco lodges, online reservation), tour operators and Travel Care, tourist information centres, licensed guides; each ends in one green action to the official page.
- **Not a repeat of:** anything pinned or stepped by scroll. No scroll mechanism at all; the pointer works inside the photograph.
- **Precedent:** Solar Fog (lit house at dusk where the cursor changes the scene, rated love), Saffron Field (light as the focus).
- **Risk:** hotspots can read as gadgets, so the doorways are the photograph's own lit doors with no icons, rings or pins. If it still feels like hotspots, the fallback is the four practical lines in the closing section.

Stunning Wonders' three themes (heritage, Malabar, wellness) become the content of the existing Get inspired section. The three festival dates (Beemapally Uroos 11 Nov, Kalpathi Ratholsavam 14 Nov, Guruvayur Ekadasi 21 Nov, as shown on the official page, to be confirmed) go into the October and November step of the months scene. What's New, Latest News, social embeds and partner logos stay out.

Flow becomes 14 sections, Red Dot's count.

## Footage needed
The five films need new clips. Without your own footage the section plays slow push-in stills of the same five scenes and says so. Photographs for the rest come from Unsplash and Wikimedia Commons.

## Critic log
Round 1: fix. Round 2: fix (small, applied). Round 3 (after the repetition rewrite): fix (small, applied): wall by scroll instead of cursor, leaflet without a render, cinema depends on real footage, lane warm not dark.

Reply go, or tell me what to change.
