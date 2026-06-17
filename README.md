# Renderer — Pause. Edit. Render.

A video-catalog platform where you **upload a video, play it, pause it into
frames, and edit those frames live** — adding and repositioning text, logos,
shapes and colors — then **export a deterministic MP4** rendered with
[Remotion](https://www.remotion.dev/) on AWS Lambda.

The key idea: the exact same Remotion composition powers the in-browser preview,
the paused-frame filmstrip, **and** the final cloud render. What you see while
editing is what you get on export — frame for frame.

---

## What you can do

- **Catalog** — upload `.mp4` / `.webm` / `.mov` videos; each becomes an editable project.
- **Play & pause** — a custom transport drives the Remotion `<Player>`. The moment you pause, a **filmstrip of the current frame plus the upcoming frames** appears (real composition thumbnails, overlays included). Click any frame to jump to it.
- **Edit overlays** — add **text**, **logos/images**, and **shapes** (rectangle / ellipse / line). Drag and resize directly on the video, or fine-tune everything in the properties panel: color, font, size, weight, alignment, stroke, opacity, rotation, corner radius, fades.
- **Frame-range timing** — every overlay has a **start frame + duration**, shown as a draggable/resizable bar on the timeline. Overlays appear only for their span, which is what makes the output deterministic.
- **Autosave** — edits persist automatically (debounced) to the project store.
- **Export** — burn the overlays into a downloadable MP4 via Remotion Lambda, with live progress.

---

## Tech stack

| Layer | Choice |
|---|---|
| App framework | **Next.js 15** (App Router) + React 18 + TypeScript |
| Video engine | **Remotion 4** — `@remotion/player` (preview + thumbnails), `@remotion/lambda` (render) |
| State | **Zustand** |
| Validation | **Zod** (one schema shared by UI, composition, and render API) |
| Styling | **Tailwind CSS** |
| Persistence | File-backed JSON store (swap for a DB by replacing `src/lib/storage.ts`) |

---

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

Upload a video and you'll land in the editor. **Editing and preview work with
zero configuration** — no AWS, no env vars. Export is the only feature that
needs setup (below).

Useful scripts:

```bash
npm run dev               # Next.js dev server
npm run build             # production build
npm run typecheck         # tsc --noEmit
npm run remotion:studio   # open the composition in Remotion Studio
npm run remotion:deploy   # provision Lambda + site bundle (prints env vars)
```

---

## How it fits together

```
Upload (browser probes width/height/duration)
   └─ POST /api/projects ─────────────► public/uploads + data/projects/<id>.json
Editor (/editor/[id])
   ├─ <Player>  ──── VideoEditorComposition (OffthreadVideo + overlays)
   ├─ Filmstrip ──── <Thumbnail> of currentFrame … +N   (same composition)
   ├─ OverlayCanvas  drag/resize overlays in composition pixels
   ├─ Timeline       drag/resize overlay frame-ranges + scrub
   └─ autosave ────► PATCH /api/projects/[id]
Export
   └─ POST /api/render ─► renderMediaOnLambda ─► poll GET /api/render ─► MP4 URL
```

### Why it's deterministic
Overlays are stored in **composition pixel coordinates** (the video's intrinsic
resolution). The editor canvas only *scales* those to screen space. The
composition (`src/remotion/VideoEditorComposition.tsx`) is sized at render time
from the project metadata via `calculateMetadata`, so the browser preview, the
filmstrip thumbnails, and the Lambda render all rasterize identical pixels.

### Key files
```
src/lib/types.ts                  Zod schemas + types (the shared contract)
src/remotion/                     Composition, overlays, Lambda entry point
src/store/useEditorStore.ts       Editor state (overlays, selection, playhead)
src/components/                    Player stage, canvas, timeline, filmstrip, panels
src/app/api/projects/             Project CRUD + upload
src/app/api/render/               Start render + poll progress (Lambda)
scripts/deploy.mjs                One-shot Lambda + site deploy
```

---

## Export (Remotion Lambda)

Export is gated until Lambda is configured — the button explains what's missing.

**1. Deploy the function + site bundle** (needs AWS credentials in your env —
see [Remotion's Lambda setup](https://www.remotion.dev/docs/lambda/setup)):

```bash
export REMOTION_AWS_ACCESS_KEY_ID=...
export REMOTION_AWS_SECRET_ACCESS_KEY=...
npm run remotion:deploy
```

**2. Copy the printed values into `.env.local`** (template in `.env.example`):

```
REMOTION_AWS_REGION=us-east-1
REMOTION_LAMBDA_FUNCTION=remotion-render-...
REMOTION_SERVE_URL=https://...amazonaws.com/sites/renderer-video-editor/index.html
```

**3. Make the source video reachable by Lambda.** Lambda renders in the cloud,
so it cannot read `localhost/uploads/...`. Either:
- set `PUBLIC_BASE_URL` to a public URL that serves `/uploads/*` (a tunnel like
  ngrok in dev, or a CDN in prod), **or**
- host videos on a public bucket and store that URL as the project's `publicSrc`.

Then restart the app and hit **Export MP4**. Progress streams in; when done you
get a direct download link to the rendered file on S3.

> Logos added via the toolbar are embedded as data URLs (instant, no upload).
> For Lambda renders, prefer small logos or paste a public image URL in the
> overlay's *Source URL* field to keep the render payload lean.

---

## Limitations & next steps

- **Storage is file-based** for zero-setup demos. Replace the four functions in
  `src/lib/storage.ts` with a real database for multi-user / production use.
- **FPS** is normalized to 30 on upload (the composition re-times deterministically); expose it in the UI if you need source-native frame rates.
- **Global editor store** is fine for single-project editing; move to a
  per-request/context store if you embed multiple editors on one page.
- Natural extensions: overlay keyframe animation, audio/waveform track, undo/redo
  history, S3-direct uploads, and authentication.
