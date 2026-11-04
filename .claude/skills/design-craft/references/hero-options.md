# Hero options (the first impression decides how unique the site feels)

The owner: the hero is what makes a site feel unique; interactivity, immersion and smoothness are the point. So every plan offers **three hero options**, not one default, and the owner picks. A film hero is only one of them and is the most common, so never offer it alone.

## The menu (each drawn from an approved site here)

| Type | What the visitor gets | Precedent | Needs | Cost and risk |
| --- | --- | --- | --- | --- |
| **3D object you can turn** | The client's real object rendered in three.js, turning with the pointer or scroll | more-coffee (tub), halcyon (glass, keycaps) | A model or generated render; load after first paint | Model must match the brand; test phones |
| **Scripted film that becomes the page** | A short film whose last frame is the finished page, UI easing in out of blur | halcyon (kingfisher) | Generated or stock clip, 1080p, real bitrate | Quality of the clip is everything |
| **Type that interacts with the image** | Huge type behind or around a cut-out subject, depth from one trick | orra (text behind the object) | A clean cut-out of the subject | Needs a high quality subject image |
| **A gate or object you touch to enter** | One tactile thing opens the page (and can start sound) | garden (seal and doors), djeska (vinyl gate) | A drawn or CSS object, one gesture | Once per session; must skip fast |
| **Transition reveal** | Pixels, blur or slices clear to reveal the hero | djeska (pixel dissolve), ileife (blur to clarity), portfolio (pixels) | Almost nothing | Easily overused |
| **Pointer or scroll world** | The hero reacts to the cursor or scroll as a small world (thread, rope, parallax layers) | garden (rope), portfolio (physics cards) | Layers of art | Many layers get noisy; keep it calm |
| **Full-bleed film with a moment** | Film plus one added interactive moment (cursor follows, word reveals, mark builds) | EVM (film plus builds) | Stock or generated film | Most common, so it needs the extra moment |


## Owner favourite: the scroll-scrubbed hero
The owner loves a hero where **scrolling plays the scene**: a car drives along a road, an object turns or assembles, a camera flies through a place, and the page only moves on when the visitor scrolls. Precedents: More Coffee (a 200-frame scroll sequence and a 23-frame hero turn), Atlas Nav (camera moves on as you scroll), the Garden's scroll-driven first dance. Make it with one of: (a) a frame sequence drawn to a canvas and stepped by GSAP ScrollTrigger (best control, smooth both ways; export 100 to 200 frames as webp, load progressively); (b) a short video whose currentTime is scrubbed by scroll (encode with a keyframe on every frame or the scrub stutters); (c) a three.js object or camera driven by scroll progress (best for a car or product, needs a model). Generate or film the source (a clip from `gen-media.mjs`, a render, or a stock clip), pin the hero while it plays, and give phones the same scene with native scrolling and a lighter frame count. The first frame must be a good still hero for anyone who has not scrolled yet. Count it as an interactive option.

## How to offer them
- In the plan, before the section list, give **three** hero options rooted in the client's subject, each with: what the visitor sees in the first five seconds, the technique, what it needs, one risk, and which of our sites did something like it. Recommend one and say why.
- At least one option must be interactive or 3D, and at most one may be a plain film.
- The chosen hero should be the first place the **spine** (section 11) shows: the same idea that runs down the page starts here.
- Look for extra ideas on details.so (hero, cursor-interaction, 3d categories) and in the owner's own sites; use them to make options specific, not to copy.

## Where to look for more hero ideas
- **motionsites.ai** (owner's tip; a paid library of AI website prompts, previews are public). Browse the public previews by tag (3D, Interactive, Scroll-Driven, Landing Page) for how a hero behaves: a 3D object you orbit (Roadster 3D, a 3D character), a scroll-driven hero (Freight Scroll Hero, Jellyfish Scroll), a hero where type and image interact, looping video backgrounds. Take only the idea of the first five seconds and re-root it in the client's subject. Do not use its paid prompts or code, do not copy a template, and do not use its section layouts: many previews are SaaS or AI-agent pages in dark glass, and templates are shared by many buyers, so copying them makes a site look like everyone else's. Use it after the three options are drafted, to make one of them more specific.

### Seen on motionsites.ai (owner's picks: Liquid Glass Agency, Digital Experiences, Aethera Studio)
All three are one formula: a dark, cinematic, AI-generated film of one scene (macro moss and stone with flowers; green hills) behind frosted-glass UI, an elegant serif headline and a pill button. The owner likes these; this is in their taste (compare Halcyon, whose approved hero has a kingfisher film and glass cards). **Take:** the film is the whole mood and is generated for the client's subject (a night road, tea hills, a showroom floor); glass UI that sits in the scene as part of it; big calm type. Generate the film with `scripts/gen-media.mjs` at a quality that survives full screen. **Watch:** glass is fine when it is a few considered pieces that belong to the scene (Halcyon), not a row of identical frosted cards (the owner's no-boxy-rows rule), and the sheen must depict light, not decorate (no-decorative-gradients rule). The shared dark-glass-serif look is used by many buyers, so make the scene and the type this client's own. Count it as the plain-film option unless the hero adds a real interaction (pointer, scroll-driven camera, 3D object).

### More owner picks, and the mechanism in each (motionsites.ai)
- **Relocation Card:** one rendered object (a card) tumbling alone in a pale sky; the object is the hero. Mechanism: a single 3D object floating in an empty scene, turning with scroll or pointer. For a car group: one car in a night road scene.
- **Atlas Nav:** a full-bleed cinematic landscape film (a river through a valley) with only a sparse nav and "scroll down"; the camera flies on as you scroll. Mechanism: a scroll-driven camera through one generated or filmed place. For a Kerala client: the road through the hills.
- **Lauberhorn Ridge:** a full-bleed photograph with a few glass data widgets over it (weather, distance, altitude) that read like live instruments. Mechanism: glass panels as real information about the place, not decoration.
- **Unwind Hero:** a moody misty cabin film, large light-weight type and one glass booking card. Mechanism: film as mood plus one glass piece that does a job.

**Using motionsites.ai correctly:** (1) choose previews by the client's subject and tag, not by look; (2) write down the mechanism in one sentence (what moves, what the visitor does), not the surface; (3) combine one mechanism with the client's spine and its own scene, never copy a template's scene, type or palette; (4) glass pieces must carry real information or an action; (5) the rest of the page does not follow the template, it follows the reference and the spine.

**The lookup is targeted, not a crawl.** After drafting the three options: (1) pick one to three gallery tags from the client's subject (for example Travel, 3d, Interactive, Hero); (2) `node .claude/skills/design-craft/scripts/motionsites-shortlist.mjs list <Tag>` to see the public preview titles; (3) `shots <Tag> <n> --out <dir>` for the few that match; (4) look at the frames, write the mechanism of each in one sentence, and use it to sharpen one option. Stills do not show scroll behaviour, so for a promising one open `https://motionsites.ai/?prompt=<slug>` and scroll it. Never crawl the whole gallery and never use the paid prompts or code.

