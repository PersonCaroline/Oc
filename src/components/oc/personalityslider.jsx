import React from "react";

export default function PersonalitySlider({ left, right, value = 50, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className={value <= 25 ? "text-foreground font-semibold" : "text-muted-foreground"}>{left}</span>
        <span className={value >= 75 ? "text-foreground font-semibold" : "text-muted-foreground"}>{right}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="oc-range"
        aria-label={`${left} vs ${right}`}
      />
    </div>
  );
}