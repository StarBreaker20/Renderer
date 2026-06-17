"use client";

/** Small labeled form controls used throughout the properties panel. */

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="number"
        className="field-input"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea
          className="field-input min-h-16 resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  allowTransparent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowTransparent?: boolean;
}) {
  const isTransparent = value === "transparent";
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-8 w-9 shrink-0 cursor-pointer rounded border border-edge bg-panel2"
          value={isTransparent ? "#000000" : value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {allowTransparent && (
          <button
            type="button"
            className={`rounded border border-edge px-2 py-1 text-[10px] ${
              isTransparent ? "bg-accent text-white" : "bg-panel2 text-muted"
            }`}
            onClick={() => onChange(isTransparent ? "#000000" : "transparent")}
            title="Toggle transparent"
          >
            none
          </button>
        )}
      </div>
    </label>
  );
}

export function RangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        <span className="ml-1 font-mono text-gray-300">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
