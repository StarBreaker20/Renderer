"use client";

import type { Overlay } from "@/lib/types";
import { useEditorStore, useSelectedOverlay } from "@/store/useEditorStore";
import {
  ColorField,
  NumberField,
  RangeField,
  SelectField,
  TextField,
} from "./fields";

export function PropertiesPanel() {
  const selected = useSelectedOverlay();
  if (!selected) return <ProjectProperties />;
  return <OverlayProperties overlay={selected} />;
}

function ProjectProperties() {
  const project = useEditorStore((s) => s.project);
  const setName = useEditorStore((s) => s.setName);
  const setBackgroundColor = useEditorStore((s) => s.setBackgroundColor);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Project</h3>
        <p className="text-[11px] text-muted">
          Select an overlay to edit it, or add one from the left.
        </p>
      </div>
      <TextField label="Name" value={project.name} onChange={setName} />
      <ColorField
        label="Background (letterbox)"
        value={project.backgroundColor}
        onChange={setBackgroundColor}
      />
      <dl className="grid grid-cols-2 gap-2 text-xs text-muted">
        <div>
          <dt className="uppercase tracking-wide">Resolution</dt>
          <dd className="text-gray-200">
            {project.width}×{project.height}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">FPS</dt>
          <dd className="text-gray-200">{project.fps}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Frames</dt>
          <dd className="text-gray-200">{project.durationInFrames}</dd>
        </div>
      </dl>
    </div>
  );
}

function OverlayProperties({ overlay }: { overlay: Overlay }) {
  const update = useEditorStore((s) => s.updateOverlay);
  const remove = useEditorStore((s) => s.removeOverlay);
  const duplicate = useEditorStore((s) => s.duplicateOverlay);
  const project = useEditorStore((s) => s.project);

  // `key` is a field of one specific overlay member; since `overlay` is a
  // discriminated union here, we accept a loose key and let the per-type JSX
  // below guarantee the field actually exists on the active overlay.
  const set = (key: string, value: unknown) =>
    update(overlay.id, { [key]: value } as Partial<Overlay>);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold capitalize">{overlay.type}</h3>
        <div className="flex gap-1">
          <button
            className="btn-ghost px-2 py-1 text-xs"
            onClick={() => duplicate(overlay.id)}
          >
            Duplicate
          </button>
          <button
            className="btn-ghost px-2 py-1 text-xs text-red-400"
            onClick={() => remove(overlay.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Type-specific */}
      {overlay.type === "text" && (
        <Section title="Text">
          <TextField
            label="Content"
            value={overlay.text}
            onChange={(v) => set("text", v)}
            multiline
          />
          <ColorField label="Color" value={overlay.color} onChange={(v) => set("color", v)} />
          <ColorField
            label="Background"
            value={overlay.backgroundColor}
            onChange={(v) => set("backgroundColor", v)}
            allowTransparent
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Font size" value={overlay.fontSize} min={1} onChange={(v) => set("fontSize", v)} />
            <NumberField label="Weight" value={overlay.fontWeight} min={100} max={900} step={100} onChange={(v) => set("fontWeight", v)} />
          </div>
          <SelectField
            label="Align"
            value={overlay.textAlign}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => set("textAlign", v)}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Line height" value={overlay.lineHeight} step={0.1} min={0.5} onChange={(v) => set("lineHeight", v)} />
            <NumberField label="Letter spacing" value={overlay.letterSpacing} step={0.5} onChange={(v) => set("letterSpacing", v)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Padding" value={overlay.padding} min={0} onChange={(v) => set("padding", v)} />
            <NumberField label="Corner radius" value={overlay.borderRadius} min={0} onChange={(v) => set("borderRadius", v)} />
          </div>
        </Section>
      )}

      {overlay.type === "shape" && (
        <Section title="Shape">
          <SelectField
            label="Type"
            value={overlay.shape}
            options={[
              { value: "rectangle", label: "Rectangle" },
              { value: "ellipse", label: "Ellipse" },
              { value: "line", label: "Line" },
            ]}
            onChange={(v) => set("shape", v)}
          />
          <ColorField label="Fill" value={overlay.fill} onChange={(v) => set("fill", v)} allowTransparent />
          <ColorField label="Stroke" value={overlay.stroke} onChange={(v) => set("stroke", v)} allowTransparent />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Stroke width" value={overlay.strokeWidth} min={0} onChange={(v) => set("strokeWidth", v)} />
            <NumberField label="Corner radius" value={overlay.borderRadius} min={0} onChange={(v) => set("borderRadius", v)} />
          </div>
        </Section>
      )}

      {overlay.type === "image" && (
        <Section title="Image">
          <TextField label="Source URL" value={overlay.src} onChange={(v) => set("src", v)} />
          <SelectField
            label="Fit"
            value={overlay.objectFit}
            options={[
              { value: "contain", label: "Contain" },
              { value: "cover", label: "Cover" },
              { value: "fill", label: "Fill" },
            ]}
            onChange={(v) => set("objectFit", v)}
          />
          <NumberField label="Corner radius" value={overlay.borderRadius} min={0} onChange={(v) => set("borderRadius", v)} />
        </Section>
      )}

      {/* Geometry */}
      <Section title="Position & size">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={overlay.x} onChange={(v) => set("x", v)} />
          <NumberField label="Y" value={overlay.y} onChange={(v) => set("y", v)} />
          <NumberField label="Width" value={overlay.width} min={1} onChange={(v) => set("width", v)} />
          <NumberField label="Height" value={overlay.height} min={1} onChange={(v) => set("height", v)} />
        </div>
        <RangeField label="Rotation" value={overlay.rotation} min={-180} max={180} onChange={(v) => set("rotation", v)} suffix="°" />
        <RangeField label="Opacity" value={overlay.opacity} min={0} max={1} step={0.05} onChange={(v) => set("opacity", v)} />
      </Section>

      {/* Timing */}
      <Section title="Timing (frames)">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Start"
            value={overlay.startFrame}
            min={0}
            max={project.durationInFrames - 1}
            onChange={(v) => set("startFrame", clampInt(v, 0, project.durationInFrames - 1))}
          />
          <NumberField
            label="Duration"
            value={overlay.durationInFrames}
            min={1}
            max={project.durationInFrames}
            onChange={(v) => set("durationInFrames", clampInt(v, 1, project.durationInFrames))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Fade in" value={overlay.fadeInFrames} min={0} onChange={(v) => set("fadeInFrames", Math.max(0, Math.round(v)))} />
          <NumberField label="Fade out" value={overlay.fadeOutFrames} min={0} onChange={(v) => set("fadeOutFrames", Math.max(0, Math.round(v)))} />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-edge pt-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </h4>
      {children}
    </div>
  );
}

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}
