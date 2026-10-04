import React from "react";

export default function PipBar({ label, value = 0, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted-foreground capitalize">{label}</span>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} level ${n}`}
            onClick={() => onChange(value === n ? 0 : n)}
            className={value >= n ? "pip-filled" : "pip-empty"}
          />
        ))}
      </div>
    </div>
  );
}
