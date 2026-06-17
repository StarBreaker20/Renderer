# rendrr — Positioning & Strategy Brief (v0.1 draft)

> Working thesis: **rendrr is not a video editor. It's a system for turning one
> video into thousands of personalized, deterministic variants — "Figma + an API
> for video catalogs."** We win on reproducibility and scale, not on having more
> editing features than CapCut.

---

## 1. Market context

The "edit video in the browser" space splits into three camps:

| Camp | Players | What they actually are |
|------|---------|------------------------|
| **Generative** | HeyGen, Synthesia, Runway, Pika, Sora | Make *new* footage (AI avatars, text-to-video). A model race. |
| **Horizontal editors** | CapCut, Veed, Kapwing, Canva Video, Descript | Timeline editors for humans making one video at a time. |
| **Programmatic / dev** | Remotion, Shotstack, Creatomate, editframe | Render video from code/JSON via API. Powerful, but no editing UX. |

The gap: **the programmatic camp has the right engine but no human-friendly
editor; the horizontal camp has the editor but bakes everything into pixels so
nothing scales or automates.** rendrr sits exactly in that gap — a visual editor
on top of a deterministic, data-driven engine.

## 2. Why we don't fight head-on

- **Vs HeyGen/Runway (generative):** different category. They synthesize
  footage; we edit and templatize *existing* footage. Not our race to lose.
- **Vs CapCut/Veed (horizontal):** generic "add text + logo to a timeline" is
  commoditized and free. If rendrr is just a prettier overlay editor, we lose on
  features and distribution. We must do something they *structurally* can't.
- **Vs Creatomate/Shotstack (programmatic):** they're API-only. Marketers and
  merchants can't use them without engineers. Our editor is the wedge they lack.

## 3. The unfair advantage (what we already built)

Two architectural choices give us leverage nobody in a single camp has:

1. **Every edit is structured data.** Overlays are JSON pinned to frame ranges,
   not pixels burned into a clip. → edits are parameterizable, diffable,
   versionable, and swappable.
2. **The renderer is deterministic (Remotion).** The browser preview *is* the
   final output, frame-exact. → what you approve is exactly what ships, and the
   same project renders identically 10,000 times with different data.

Editor UX **+** data model **+** deterministic engine, in one product. That
intersection is the moat.

## 4. Target user (pick the beachhead)

**Recommended beachhead: e-commerce / retail product video.**

- **Who:** D2C brands, marketplaces, and agencies producing product + promo
  video at volume.
- **Pain:** they shoot one hero video, then need 50 versions — per SKU, per
  locale, per promo, per channel aspect ratio. Today that's manual re-editing or
  expensive agencies.
- **Why them:** the "catalog" framing from day one maps directly to a product
  catalog; the value (variants × channels × locales) is obvious and measurable;
  budgets exist.

**Adjacent expansion:** personalized sales/marketing video (1:1 outreach with
the prospect's name/company/logo burned in) and localized course/training video.

## 5. The product — three pillars

### Pillar 1 — Frame-accurate visual editing (have: v0.1)
Pause into a filmstrip, pin overlays to exact frame ranges, drag/resize on a
canvas that matches the render 1:1. This is the human on-ramp. Table stakes,
but the foundation for everything else.

### Pillar 2 — Variables & bulk render (the wedge)
Promote any overlay property to a **variable** (`{{price}}`, `{{name}}`,
`{{logo}}`, `{{lang}}`). Then:
- **Batch render** from a CSV / product feed / API call → N MP4s.
- **Render API** so it runs inside someone's pipeline (Shopify, CRM, ad tooling).
- Every render is reproducible and versioned — *git for video*.

This is what neither CapCut (no data) nor Creatomate (no editor) can offer in
one place.

### Pillar 3 — Object-aware editing (the "magic")
Use detection + tracking so an overlay **anchors to a moving object**: swap a
sign, label, or logo and it follows the object through the shot. This is the
literal payoff of the original "pause and edit the sign" vision — and it's the
demo that makes people say "how did you do that."

## 6. Sequencing (smallest path to differentiated)

1. **Now → wedge:** variables on overlays + a "render N variants from a
   spreadsheet" flow. Highest value, builds straight on the current JSON model.
2. **Then → API:** expose the existing render path as a documented endpoint +
   SDK. Turns the tool into infrastructure.
3. **Then → magic:** object detection/tracking for anchored overlays. Highest
   wow, highest effort — do it once the data-driven core has pull.

## 7. What we deliberately will NOT build

- A general-purpose multi-track NLE (cuts, transitions, audio mixing). That's
  CapCut's game and a feature treadmill.
- AI footage generation. Not our category.
- A consumer "make me a TikTok" toy. We're aimed at repeatable, business-scale
  output, not one-off creativity.

## 8. Risks & honest unknowns

- **Asset hosting for scale:** bulk/Lambda renders need public source media
  (S3/CDN). Today local uploads aren't reachable by Lambda — must solve hosting
  before batch is real.
- **Tracking quality:** object tracking is hard; ship it as "assisted, with
  manual keyframe correction," not magic-or-nothing.
- **Positioning discipline:** the temptation to add editor features will be
  constant. The CSV-to-variants demo must stay the headline.

## 9. One-line pitch candidates

- "Edit one video. Render ten thousand. rendrr is the API + editor for
  personalized video catalogs."
- "Figma for video templates — with a render API."
- "Turn your product videos into a programmatic catalog."
