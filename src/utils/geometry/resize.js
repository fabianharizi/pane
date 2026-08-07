// Selection-chrome math: the handle table and the box arithmetic behind a
// resize drag. Kind-agnostic — this operates on the group's bounding box, and
// it is each element kind's job to map itself into the result (see mapIntoBox).
//
// Extracted from SelectionBox.jsx so it can be tested: a .jsx file that exports
// both a component and plain functions trips react-refresh/only-export-components.

// Smallest the selection box may be resized to, in SCREEN px (divided by zoom
// at use, so the minimum feels constant at any zoom). Prevents collapse/flip.
export const MIN_SIZE = 10

// Resize handles. Each declares which edges of the bounding box it moves;
// corners move two edges (and support Shift aspect-lock), edges move one.
export const HANDLES = [
  { pos: "nw", cursor: "nwse-resize", edges: ["left", "top"] },
  { pos: "n",  cursor: "ns-resize",   edges: ["top"] },
  { pos: "ne", cursor: "nesw-resize", edges: ["right", "top"] },
  { pos: "e",  cursor: "ew-resize",   edges: ["right"] },
  { pos: "se", cursor: "nwse-resize", edges: ["right", "bottom"] },
  { pos: "s",  cursor: "ns-resize",   edges: ["bottom"] },
  { pos: "sw", cursor: "nesw-resize", edges: ["left", "bottom"] },
  { pos: "w",  cursor: "ew-resize",   edges: ["left"] },
]

// Position within the box, as a percentage, derived from the compass name.
export const handleOffset = (pos) => ({
  x: pos.includes("w") ? 0 : pos.includes("e") ? 100 : 50,
  y: pos.includes("n") ? 0 : pos.includes("s") ? 100 : 50,
})

// Rotation is stored in degrees, about the element center.
export const snap15 = (d) => Math.round(d / 15) * 15

// Resize the group box by moving the handle's edges, clamped to minSize (world
// units) so it can never cross its anchor edge (no flip).
export function resizeBox(origin, edges, dx, dy, shift, minSize) {
  let { left, top, right, bottom } = origin
  if (edges.includes("left"))   left   = origin.left   + dx
  if (edges.includes("right"))  right  = origin.right  + dx
  if (edges.includes("top"))    top    = origin.top    + dy
  if (edges.includes("bottom")) bottom = origin.bottom + dy

  // Shift locks the original aspect ratio — corners only (two edges).
  if (shift && edges.length === 2) {
    const w0 = origin.right - origin.left
    const h0 = origin.bottom - origin.top
    if (w0 !== 0 && h0 !== 0) {
      const ar = w0 / h0
      const w = right - left
      const h = bottom - top
      if (Math.abs(w / w0) > Math.abs(h / h0)) {
        const newH = w / ar
        if (edges.includes("top")) top = bottom - newH
        else                       bottom = top + newH
      } else {
        const newW = h * ar
        if (edges.includes("left")) left = right - newW
        else                        right = left + newW
      }
    }
  }

  // Clamp each moved edge so the box keeps at least minSize and never flips.
  if (edges.includes("left"))   left   = Math.min(left,   right  - minSize)
  if (edges.includes("right"))  right  = Math.max(right,  left   + minSize)
  if (edges.includes("top"))    top    = Math.min(top,    bottom - minSize)
  if (edges.includes("bottom")) bottom = Math.max(bottom, top    + minSize)

  return { left, top, right, bottom }
}
