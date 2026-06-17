# Feasibility: auto-tracking + replacing a *moving, baked-in* element

**Question:** can rendrr let a user replace a logo/text that is **baked into the
source footage** and **moves around**, so the replacement stays glued to it?

**Short answer:** the *replacement* (a moving overlay) is easy and deterministic.
The two hard halves are **(a) tracking** the original automatically and
**(b) removing/inpainting** the original so it disappears. Tracking is feasible
*assisted* (auto-propose + human correct). Fully-automatic, hands-off removal at
good quality needs a **GPU inpainting service** with non-trivial cost and
licensing caveats — it cannot run in the browser or on Remotion Lambda.

This was validated with a spike on real footage (see `screenshots/tracking/`).

---

## 1. The problem splits into three parts

| Part | What it means | Difficulty |
|---|---|---|
| **Replace** | Draw the new logo/text and make it follow a path | **Easy** — pure overlay maths, deterministic |
| **Track** | Find where the original is on every frame | **Medium** — assisted works; full-auto is content-dependent |
| **Remove (inpaint)** | Erase the original so it isn't visible under/near the new one | **Hard** — GPU ML, heavy, licensing |

You only need *Remove* if the new element doesn't fully cover the old one. If the
replacement is opaque and at least as large, **Track + Replace alone** is enough.

---

## 2. How this plugs into rendrr today

Overlays render in `src/remotion/overlays/OverlayItem.tsx` with **static**
`x/y/width/height` per overlay (composition pixels). To "follow" motion we need
**per-frame position** — i.e. keyframes that the composition interpolates with
Remotion's `interpolate()` against `useCurrentFrame()`.

Proposed schema addition (back-compat — absent = today's static behaviour):

```ts
// overlayBaseSchema.extend(...)
keyframes: z.array(z.object({
  frame: z.number().int().min(0),  // absolute composition frame
  x: z.number(), y: z.number(),
  width: z.number().min(1), height: z.number().min(1),
})).default([]),
```

`OverlayItem` interpolates `left/top/width/height` between surrounding keyframes
(linear or eased). **This keeps the render 100% deterministic** — the keyframes
are plain stored data, identical in preview, filmstrip, and Lambda. A "track" is
just an auto-generated keyframe list.

> **Determinism rule:** any ML (tracker / inpainter) runs **once, offline**, and
> its result is *baked* into stored data — a keyframe array, or a pre-processed
> inpainted video asset. The Remotion render never calls a model, so
> what-you-see-is-what-you-get is preserved.

---

## 3. Spike results (measured, not theoretical)

Test clip: the B2B dashboard with a **moving "◆ ACME" logo** composited in
(known ground-truth path, so error is measurable). OpenCV 4.13, CPU only.

| Tracker | Motion | Mean err | Median err | Speed | Verdict |
|---|---|---|---|---|---|
| `TrackerMIL` (no model) | fast | 350px (27% w) | 300px | ~3.5 fps | **fails** |
| `TrackerVit` (715KB ONNX) | fast | 174px (13.6% w) | 178px | ~48 fps | **fails** (box diverges) |
| `TrackerVit` | gentle/realistic | 90px* (7% w) | **12px (~1% w)** | ~48 fps | **good when locked**, *loses lock a few frames |

\* mean is inflated by a handful of frames where it lost the target entirely
(direction changes); median 12px shows it's pixel-accurate the rest of the time.

**Takeaways**
- Model-free classic trackers (MIL/KCF/CSRT-style) are too weak/slow — not viable.
- A small ViT tracker is **fast on CPU** and **accurate on slow motion**, but
  **drops lock** on fast motion / ambiguous targets → needs re-init or manual fix.
- → **Assisted** tracking (auto-propose, human-correct the few bad frames) is the
  sweet spot. Robust hands-off tracking needs SOTA models (below).

Proof images:
- `screenshots/tracking/01-track-success.png` — ViT box hugging the logo (gentle motion).
- `screenshots/tracking/02-track-fail.png` — box ballooned to full frame (fast motion).
- `screenshots/tracking/03-static-removal-before|after.png` — `ffmpeg delogo` baseline.

---

## 4. SOTA landscape (mid-2026) and where it can run

**Tracking / segmentation**
- **SAM 3.1** (Meta, Mar 2026): promptable (box/text), tracks ~16 objects/forward
  pass, ~32 fps **on an H100**. Best quality; GPU-bound.
- **SAM2.1 / EfficientTAM / Cutie / CoTracker3**: strong, all GPU.
- **OpenCV ViT/Nano trackers**: CPU, fast, weaker (what the spike used).

**Video inpainting / object removal**
- **ProPainter** (ICCV'23) — still a top open baseline. GPU memory at **1280×720 ≈
  19 GB (fp16) / 28 GB (fp32)** for 50 frames; ~0.05–0.3 s/frame on a big GPU.
- **E2FGVI, HomoGen (CVPR'25), Drafting&Revision (IJCAI'25)** — better quality, all GPU.
- **`ffmpeg delogo`** — CPU, instant, but only for a **static rectangular** region
  (interpolates from the border). Fine for fixed watermarks; useless for motion.
- ⚠️ **Licensing:** ProPainter/E2FGVI etc. are research releases (often
  **non-commercial**). Shipping in a commercial SaaS needs a license review or a
  commercially-licensed alternative / self-trained model.

**Where each can run**
| Stage | Browser | Remotion Lambda | Dedicated GPU worker |
|---|---|---|---|
| Replace (keyframes) | ✅ | ✅ | — |
| Assisted track (ViT, CPU) | ⚠️ wasm-slow | ✅ (CPU) | ✅ |
| Full-auto track (SAM) | ❌ | ❌ | ✅ GPU |
| Inpaint / removal | ❌ | ❌ (no GPU, 15-min cap) | ✅ GPU (24GB+) |

Lambda has **no GPU**, so tracking-via-SAM and all inpainting must live in a
**separate async GPU service** (e.g. a queue + GPU container), with results
stored back on the project before render.

---

## 5. Recommended path (phased)

**Phase 1 — Keyframed overlays (ship first, ~no risk).**
Add the `keyframes` field + interpolation in `OverlayItem`, plus editor UX:
scrub → move overlay → "add keyframe"; markers on the timeline. This alone lets a
user **replace a moving logo/text by hand-setting ~3–6 points** — fully
deterministic, no ML, works offline. Pair with a "cover" box (also keyframed) when
the replacement doesn't fully hide the original.

**Phase 2 — Assisted tracking (CPU, medium effort).**
A `/api/track` endpoint: user draws a box on one frame → ViT/Nano tracker
auto-fills keyframes between anchor frames → user nudges the few bad ones. Turns
"set 6 points" into "set 2 + correct 1". No GPU.

**Phase 3 — Full removal (GPU service, experimental, optional).**
A separate GPU worker running ProPainter/E2FGVI behind an async job to **bake an
inpainted source video** that's stored as a new asset; the editor then treats it
as the background. Gated behind cost + a **license review**. This is the only
piece that's genuinely heavy/expensive.

**Bottom line:** ship **Phase 1** to actually solve the user's "moving logo/text
replacement" for the common case (opaque replacement), add **Phase 2** to make it
fast, and treat **Phase 3 (true erase)** as a separate, GPU-backed, license-gated
project — not a quick feature.
