// The shared geometric vocabulary — the small functions every other geometry
// module and every consumer of element coordinates is built from.
//
// These were previously scattered: `rad`/`deg`/`rotatePoint` lived in
// lineGeometry.js (a line-routing module, so anything needing to rotate a point
// had to import from it), `bboxOf` was private there and hand-rolled in four
// other places, and `centerOf` was re-derived inline five times. Nothing here
// touches React or the DOM.

export const rad = (d) => d * Math.PI / 180
export const deg = (r) => r * 180 / Math.PI

// Rotate point p about center c by `degrees`. Clockwise in screen space, since
// y grows downward.
export const rotatePoint = (p, c, degrees) => {
  const a = rad(degrees)
  const dx = p.x - c.x
  const dy = p.y - c.y
  return {
    x: c.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: c.y + dx * Math.sin(a) + dy * Math.cos(a),
  }
}

// Elements store two opposite corners in whichever order they were drawn, so
// every reader has to normalize. Inverted input (end before start) is expected,
// not an error.
export const bboxOf = ({ startX, startY, endX, endY }) => ({
  left: Math.min(startX, endX),
  top: Math.min(startY, endY),
  right: Math.max(startX, endX),
  bottom: Math.max(startY, endY),
})

// The two stored corners, in stored order. Order matters: a segment's corners
// ARE its direction, so nothing here normalises them.
export const cornerPoints = ({ startX, startY, endX, endY }) => [
  { x: startX, y: startY },
  { x: endX, y: endY },
]

// Midpoint of the two stored corners. Deliberately NOT derived from bboxOf —
// the average is the same either way, and this avoids the min/max round trip.
export const centerOf = ({ startX, startY, endX, endY }) => ({
  x: (startX + endX) / 2,
  y: (startY + endY) / 2,
})

// Map one coordinate proportionally from an old box onto a new one. Applied to
// RAW corners rather than normalized ones, which is what preserves a segment's
// direction through a group resize. A zero-size axis has no ratio to preserve,
// so it degenerates to a translation.
export const mapCoord = (v, oldMin, oldSize, newMin, newSize) =>
  oldSize === 0 ? v + (newMin - oldMin) : newMin + ((v - oldMin) / oldSize) * newSize
