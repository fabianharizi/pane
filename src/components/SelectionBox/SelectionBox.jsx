import styles from "./SelectionBox.module.css"
import usePointer from './../../utils/hooks/usePointer';
import { useRef } from "react";

// Smallest the selection box may be resized to, in SCREEN px (divided by zoom
// at use, so the minimum feels constant at any zoom). Prevents collapse/flip.
const MIN_SIZE = 10

// Resize handles. Each declares which edges of the bounding box it moves;
// corners move two edges (and support Shift aspect-lock), edges move one.
const HANDLES = [
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
const handleOffset = (pos) => ({
  x: pos.includes("w") ? 0 : pos.includes("e") ? 100 : 50,
  y: pos.includes("n") ? 0 : pos.includes("s") ? 100 : 50,
})

// Bounding box over every element's raw corners (center-relative). One element
// is just a group of one — same math for any count.
const boundsOf = (elements) => elements.reduce((b, el) => {
  const { startX, startY, endX, endY } = el.properties
  return {
    left: Math.min(b.left, startX, endX),
    top: Math.min(b.top, startY, endY),
    right: Math.max(b.right, startX, endX),
    bottom: Math.max(b.bottom, startY, endY),
  }
}, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })

// Resize the group box by moving the handle's edges, clamped to minSize (world
// units) so it can never cross its anchor edge (no flip).
function resizeBox(origin, edges, dx, dy, shift, minSize) {
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

// Map a raw coordinate proportionally from the old group box to the new one.
// Mapping raw corners (no per-element min/max) preserves a line's direction.
// A zero-size axis degenerates to translation.
const mapCoord = (v, oldMin, oldSize, newMin, newSize) =>
  oldSize === 0 ? v + (newMin - oldMin) : newMin + ((v - oldMin) / oldSize) * newSize

// `interactive` gates all dragging: only the select tool may resize/move. While
// the move tool (or hold-Space pan) is active the box is just a visual outline,
// so a pan over a selected element pans instead of moving it.
// `zoom` converts pointer deltas (screen px) into world units — every drag here
// divides by it — and counter-scales the handles via CSS.
export default function SelectionBox({ elements, zoom, updateElements, interactive }) {
  const box = boundsOf(elements)

  // Body-drag: dragging the container interior moves the whole selection.
  const bodyRef = useBodyDrag(elements, zoom, updateElements, interactive)

  // Endpoint handles are a line-type affordance (endpoint identity is per-line,
  // meaningless on a group), so they apply to a lone selected line only.
  const loneLine = elements.length === 1 && elements[0].type === "line" ? elements[0] : null

  return (
    <div
      className={interactive ? `${styles.box} ${styles.interactive}` : styles.box}
      ref={bodyRef}
      style={{
        "--x": box.left + "px",
        "--y": box.top + "px",
        "--width": (box.right - box.left) + "px",
        "--height": (box.bottom - box.top) + "px",
      }}
    >
      {interactive && (loneLine
        ? <LineHandles element={loneLine} zoom={zoom} updateElements={updateElements} box={box} />
        : HANDLES.map((h) => (
            <BoxHandle key={h.pos} spec={h} elements={elements} zoom={zoom} updateElements={updateElements} />
          )))}
    </div>
  )
}

// Attaches a pointer drag to the box container that translates every selected
// element together. Pointer deltas are screen px → divide by zoom for world.
function useBodyDrag(elements, zoom, updateElements, interactive) {
  const ref = useRef(null)
  const origin = useRef(null)

  usePointer(ref, {
    active: interactive,
    cursor: "move",
    onDown: () => {
      origin.current = elements.map(el => ({ uuid: el.uuid, ...el.properties }))
    },
    onMove: (p) => {
      if (!p.hasDragged) return
      const dx = (p.x - p.startX) / zoom
      const dy = (p.y - p.startY) / zoom
      updateElements(origin.current.map(o => ({
        uuid: o.uuid,
        properties: {
          startX: o.startX + dx, startY: o.startY + dy,
          endX: o.endX + dx, endY: o.endY + dy,
        }
      })))
    },
  })

  return ref
}

// A resize handle. Dragging it resizes the group box, and every element's raw
// corners are mapped proportionally into the new box — one code path whether
// the selection holds one element or many.
function BoxHandle({ spec, elements, zoom, updateElements }) {
  const ref = useRef(null)
  const origin = useRef(null)   // group box + member corners snapshotted at drag start
  const off = handleOffset(spec.pos)

  usePointer(ref, {
    active: true,
    cursor: spec.cursor,
    onDown: () => {
      origin.current = {
        box: boundsOf(elements),
        members: elements.map(el => ({ uuid: el.uuid, ...el.properties })),
      }
    },
    onMove: (p) => {
      if (!p.hasDragged) return
      const o = origin.current
      // Screen deltas → world; the minimum size is likewise a constant 10
      // SCREEN px, so it feels the same at any zoom.
      const next = resizeBox(o.box, spec.edges, (p.x - p.startX) / zoom, (p.y - p.startY) / zoom, p.shiftKey, MIN_SIZE / zoom)
      const oldW = o.box.right - o.box.left
      const oldH = o.box.bottom - o.box.top
      const newW = next.right - next.left
      const newH = next.bottom - next.top

      updateElements(o.members.map(m => ({
        uuid: m.uuid,
        properties: {
          startX: mapCoord(m.startX, o.box.left, oldW, next.left, newW),
          endX:   mapCoord(m.endX,   o.box.left, oldW, next.left, newW),
          startY: mapCoord(m.startY, o.box.top,  oldH, next.top,  newH),
          endY:   mapCoord(m.endY,   o.box.top,  oldH, next.top,  newH),
        }
      })))
    },
  })

  return (
    <span
      className={styles.handle}
      ref={ref}
      data-handle={spec.pos}
      style={{ "--hx": off.x + "%", "--hy": off.y + "%" }}
    />
  )
}

// A lone line gets one handle per endpoint, dragging the endpoint directly so
// the start→end direction (and therefore angle/arrowheads) is preserved.
function LineHandles({ element, zoom, updateElements, box }) {
  const p = element.properties
  return (
    <>
      <LineHandle
        element={element} zoom={zoom} updateElements={updateElements} box={box}
        keyX="startX" keyY="startY" x={p.startX} y={p.startY}
      />
      <LineHandle
        element={element} zoom={zoom} updateElements={updateElements} box={box}
        keyX="endX" keyY="endY" x={p.endX} y={p.endY}
      />
    </>
  )
}

function LineHandle({ element, zoom, updateElements, box, keyX, keyY, x, y }) {
  const ref = useRef(null)
  const origin = useRef(null)

  usePointer(ref, {
    active: true,
    cursor: "move",
    onDown: () => { origin.current = { x: element.properties[keyX], y: element.properties[keyY] } },
    onMove: (p) => {
      if (!p.hasDragged) return
      updateElements([{
        uuid: element.uuid,
        properties: {
          [keyX]: origin.current.x + (p.x - p.startX) / zoom,
          [keyY]: origin.current.y + (p.y - p.startY) / zoom,
        }
      }])
    },
  })

  // Pixel offset of this endpoint inside the bounding-box container.
  return (
    <span
      className={styles.endpoint}
      ref={ref}
      style={{ "--hx": (x - box.left) + "px", "--hy": (y - box.top) + "px" }}
    />
  )
}
