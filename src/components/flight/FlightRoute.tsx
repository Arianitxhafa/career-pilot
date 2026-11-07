const STOPS = [
  { x: 40, y: 150, code: "SAV", label: "Saved", hint: "Check-in" },
  { x: 290, y: 70, code: "APP", label: "Applied", hint: "Boarding" },
  { x: 560, y: 120, code: "INT", label: "Interview", hint: "Take-off" },
  { x: 820, y: 40, code: "OFR", label: "Offer", hint: "Landing" },
];
const PATH = "M40 150 C 140 150, 200 70, 290 70 S 470 120, 560 120 S 740 40, 820 40";

/** The application journey drawn as a flight route (drawn on scroll), with a plane flying it on a loop. */
export function FlightRoute() {
  return (
    <div>
      <svg viewBox="0 0 860 200" className="h-auto w-full overflow-visible" aria-hidden>
        <path d={PATH} fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="5 7" />
        <path d={PATH} fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" pathLength={1000} strokeDasharray="1000" className="route-draw" />
        {STOPS.map((s) => (
          <g key={s.code}>
            <circle cx={s.x} cy={s.y} r="12" fill="var(--surface)" stroke="var(--brand)" strokeWidth="2.5" />
            <circle cx={s.x} cy={s.y} r="4.5" fill="var(--brand)" />
          </g>
        ))}
        {/* SVG motion scales with the viewBox, so the plane stays on the route at any width. */}
        <g className="motion-reduce:hidden">
          <g>
            <circle r="15" fill="var(--brand)" opacity="0.18" />
            <path d="M-9 -3 L4 -3 L9 0 L4 3 L-9 3 L-6 0 Z M-2 -3 L2 -10 L5 -10 L3 -3 Z M-2 3 L2 10 L5 10 L3 3 Z" fill="var(--brand)" />
            <animateMotion dur="7s" repeatCount="indefinite" rotate="auto" path={PATH} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.25 1" />
          </g>
        </g>
      </svg>
      <ol className="mt-2 grid grid-cols-4 gap-2 text-center">
        {STOPS.map((s) => (
          <li key={s.code}>
            <p className="font-mono text-xs font-bold tracking-[0.2em] text-brand">{s.code}</p>
            <p className="mt-0.5 font-semibold">{s.label}</p>
            <p className="text-xs text-muted">{s.hint}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
