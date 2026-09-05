import { CAPACITY_LABEL, SPOTS_FILLED_PERCENT } from "@/lib/tournament";

// Scarcity cue. Renders in the info panel and inside the registration form, so
// it stays a plain presentational component usable from either side.
export function CapacityBar() {
  const filled = Math.min(100, Math.max(0, SPOTS_FILLED_PERCENT));

  return (
    <div className="capacity">
      <div className="capacity__label">{CAPACITY_LABEL}</div>
      <div
        className="capacity__track"
        role="progressbar"
        aria-label={CAPACITY_LABEL}
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="capacity__fill" style={{ width: `${filled}%` }} />
      </div>
    </div>
  );
}
