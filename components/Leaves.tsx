// The drifting maple leaves from the design. Purely decorative — positions,
// sizes, tilts and animation offsets are copied straight from the mockup.
const LEAVES = [
  { w: 120, top: "6%", left: "-3%", opacity: 0.16, rotate: -24, dur: 11, delay: 0, fill: "#C8682B" },
  { w: 74, top: "28%", left: "8%", opacity: 0.1, rotate: 38, dur: 9, delay: 1.4, fill: "#E9A24A" },
  { w: 160, top: "54%", left: "-5%", opacity: 0.09, rotate: 14, dur: 13, delay: 0.6, fill: "#8a4a1f" },
  { w: 96, top: "2%", right: "6%", opacity: 0.13, rotate: 52, dur: 10, delay: 0.9, fill: "#C8682B" },
  { w: 62, top: "40%", right: "2%", opacity: 0.11, rotate: -42, dur: 8, delay: 2.1, fill: "#E9A24A" },
  { w: 140, bottom: "4%", right: "-4%", opacity: 0.1, rotate: 22, dur: 12, delay: 0.3, fill: "#C8682B" },
  { w: 84, bottom: "10%", left: "34%", opacity: 0.07, rotate: -12, dur: 14, delay: 1.8, fill: "#8a4a1f" },
];

export function Leaves() {
  return (
    <div className="decor" aria-hidden="true">
      <div className="decor__beam" />
      <div className="decor__beam decor__beam--soft" />
      {LEAVES.map((leaf, i) => (
        <svg
          key={i}
          className="leaf"
          viewBox="0 0 100 120"
          width={leaf.w}
          height={leaf.w * 1.2}
          style={{
            top: leaf.top,
            bottom: leaf.bottom,
            left: leaf.left,
            right: leaf.right,
            opacity: leaf.opacity,
            transform: `rotate(${leaf.rotate}deg)`,
            animationDuration: `${leaf.dur}s`,
            animationDelay: `${leaf.delay}s`,
          }}
        >
          <path
            d="M50 4C24 26 12 52 22 78c6 16 18 28 28 38 10-10 22-22 28-38C88 52 76 26 50 4z"
            fill={leaf.fill}
          />
          <path d="M50 14v96" stroke="#0b0705" strokeOpacity="0.35" strokeWidth="2" />
          <path
            d="M50 44L28 30M50 44l22-14M50 70L26 56M50 70l24-14M50 94L32 82M50 94l18-12"
            stroke="#0b0705"
            strokeOpacity="0.28"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      ))}
    </div>
  );
}
