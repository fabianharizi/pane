// Preview icons for the Properties panel. These aren't metaphors like the
// lucide set — they draw the actual thing the option produces (a dashed stroke,
// an elbow route, an arrow tip), which is the point of showing them at all.
//
// All of them take lucide's `size` prop so option tables can mix these with
// lucide icons and style them identically. They inherit `currentColor`, so the
// active/hover states in the CSS carry through.

const svg = (size) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  "aria-hidden": true,
})

/* --- Stroke styles: the same line, drawn three ways. Heavier than the other
       icons here (3 vs 2) because the whole job of these is to make the dash
       pattern legible at 16px. The dotted line is inset to x=2..14 so its round
       caps — which extend half the stroke width past each end — don't clip
       against the viewBox. --- */

export const StrokeSolid = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <line x1="1" y1="8" x2="15" y2="8" strokeWidth="3" />
  </svg>
)

export const StrokeDashed = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <line x1="1" y1="8" x2="15" y2="8" strokeWidth="3" strokeDasharray="4.5 3.5" />
  </svg>
)

export const StrokeDotted = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <line x1="2" y1="8" x2="14" y2="8" strokeWidth="3" strokeDasharray="0.1 3" strokeLinecap="round" />
  </svg>
)

/* --- Arrowheads: which END carries the tip is the whole distinction, so start
       and end get mirrored icons rather than one shared "arrow". --- */

export const HeadNone = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <line x1="1" y1="8" x2="15" y2="8" strokeWidth="2" />
  </svg>
)

export const HeadArrowStart = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <line x1="5" y1="8" x2="15" y2="8" strokeWidth="2" />
    <path d="M1 8 L7 4.5 L7 11.5 Z" fill="currentColor" stroke="none" />
  </svg>
)

export const HeadArrowEnd = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <line x1="1" y1="8" x2="11" y2="8" strokeWidth="2" />
    <path d="M15 8 L9 4.5 L9 11.5 Z" fill="currentColor" stroke="none" />
  </svg>
)

/* --- Routing: the three route shapes, same start and end points --- */

export const RouteStraight = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <path d="M2 13 L14 3" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const RouteCurved = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <path d="M2 13 C 2 6, 8 3, 14 3" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const RouteElbow = ({ size = 16 }) => (
  <svg {...svg(size)}>
    <path d="M2 13 L8 13 L8 3 L14 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
