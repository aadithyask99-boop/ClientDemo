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
- motionsites lookup: done with `motionsites-shortlist.mjs`. Frames of eight previews in `proposal-reference-sheet.png`: Infinite Gallery, Runway Lookbook, Mostar Guide, Way Farer, Travel Journal, Tana Elephant, Saffron Field, Frostbound. Mechanisms are cited per idea below. Stills do not show scroll behaviour; I read the mechanism from the frame pairs and the gallery titles.
- Palette: unchanged Red Dot plus Kerala green (approved in the first plan). Easter eggs: the four already built stay.
- Critic: run on this version before sending.

## Five additions, ranked, one recommendation each. Every item you named has a scene.

### 1. Popular Destinations as a drifting wall (after Stays)
- **Visitor sees:** a full-bleed dark wall of eight tall photographs of different sizes (Thattekkad bird, Bekal fort, Periyar tiger, Kumarakom, Athirappilly, Munnar, Kovalam, Kavvayi). Moving the cursor drifts the wall slowly, like a camera over a table. The photograph nearest the centre sharpens and the rest soften; its name is set huge in the serif with the best months under it. Click opens the official page. Phones: drag with a finger.
- **Why it is a new thing:** the pinned fan is the seven flagship places stepped by scroll; this is the "everywhere else" moment and the only place you wander instead of scroll.
- **Precedent:** Infinite Gallery (a drifting wall where depth blur marks focus), Runway Lookbook (sharp centre, blurred neighbours).
- **Alternative:** extend the fan to twelve places.

### 2. E-Brochures: a leaflet that unfolds (after the wall)
- **Visitor sees:** one large paper leaflet, a Wayanad cover photograph with its title. Scrolling opens it: the two side flaps swing out in 3D to reveal a full-bleed double-page photograph spread (tea estate, mist) with a short line, and the page tilts slightly with the cursor. A green pill: "Download the Wayanad guide". The other guides sit below as three large cover photographs you can swap.
- **Precedent:** Runway Lookbook (pages that turn, focus pulling in and out), Travel Journal (stacked cards that swap).
- **Alternative:** a pile of covers that fans out.
- **Why new:** the only 3D object on the page after the hero.

### 3. Hospitality Services: "Four welcomes" (before the close)
- **Visitor sees:** one pinned full-bleed scene that stays four steps long. Scroll moves through four photographs with a slow push-in and soft blur between: a homestay veranda at dawn (Where to stay: Yathri Nivas and eco lodges), a boat captain at the jetty (Find a tour operator), a visitor-information desk under a tree (Tourist Information Centers), a naturalist guide on a forest path (Tour Guide). Each shows one line at 40 px and up and one green action. The Travel Care service is the first line.
- **Precedent:** Frostbound (a film that carries a travel page), Tana Elephant (one huge word behind a real subject, with the section changing under it).
- **Alternative:** four stacked full-bleed photographs, no pin.
- **Why new:** it is the only practical-help moment and it is people, not places.

### 4. Video Gallery: a cinema with the light on the page (after the wall)
- **Visitor sees:** a large framed film on paper turning dark, with the film's own colours spilling softly into the background (a blurred copy of the clip fills the section, as in Mostar Guide's framed photograph over its own enlarged copy). Five film titles in large type sit under it; choosing one cuts to that film with the hero's slanted-slice cut. Sound is off until the visitor taps it.
- **Precedent:** Mostar Guide (frame over its own blurred backdrop), Frostbound.
- **Alternative:** slices that expand on hover (rejected earlier as too close to the trips tiles).
- **Why new:** the hero is a timed film; this is a film you choose, with ambient light.

### 5. Events: "After dark" (after Get inspired)
- **Visitor sees:** one full-bleed night photograph of the next festival, its date set huge in the serif with the day in green, and the other two festivals as two large lines below. The motion is in the image: lamps flicker and a slow push-in.
- **Precedent:** Saffron Field (a dark scene whose light is the focus), Doves' night image.
- **Alternative:** three stacked night scenes.

Not additions: Stunning Wonders' three themes (heritage, Malabar, wellness) become the content of the existing Get inspired section. What's New, Latest News, Memories, Gateway, social embeds and partner logos are left out, as in the first version.

Flow becomes 15 sections against Red Dot's 14 (limit is 17). To protect the length I would let Trips and Stays share one band if the owner wants it shorter.

Reply go, or tell me what to change.
