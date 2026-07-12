import styles from "./SelectionBox.module.css"
import usePointer from './../../utils/hooks/usePointer';
import { useRef } from "react";

// Smallest a box element may be resized to (px). Prevents collapse/flip.
const MIN_SIZE = 10

// Box-element handles. Each declares which edges of the bounding box it moves;
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

// The normalized bounding box of an element, in center-relative coords.
const boxOf = (p) => ({
  left: Math.min(p.startX, p.endX),
  top: Math.min(p.startY, p.endY),
  right: Math.max(p.startX, p.endX),
  bottom: Math.max(p.startY, p.endY),
})

// Resize a box by moving the handle's edges, clamped to MIN_SIZE so it can never
// cross its anchor edge (no flip). Writes back normalized start/end corners.
function resize(origin, edges, dx, dy, shift) {
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

  // Clamp each moved edge so the box keeps at least MIN_SIZE and never flips.
  if (edges.includes("left"))   left   = Math.min(left,   right  - MIN_SIZE)
  if (edges.includes("right"))  right  = Math.max(right,  left   + MIN_SIZE)
  if (edges.includes("top"))    top    = Math.min(top,    bottom - MIN_SIZE)
  if (edges.includes("bottom")) bottom = Math.max(bottom, top    + MIN_SIZE)

  return { startX: left, startY: top, endX: right, endY: bottom }
}

// `interactive` gates all dragging: only the select tool may resize/move. While
// the move tool (or hold-Space pan) is active the box is just a visual outline,
// so a pan over a selected element pans instead of moving it.
export default function SelectionBox({ element, center, updateElement, interactive }) {
  const p = element.properties
  const box = boxOf(p)

  // Body-drag: dragging the container interior moves the whole element.
  const bodyRef = useBodyDrag(element, updateElement, interactive)

  return (
    <div
      className={interactive ? `${styles.box} ${styles.interactive}` : styles.box}
      ref={bodyRef}
      style={{
        "--x": box.left + center + "px",
        "--y": box.top + center + "px",
        "--width": (box.right - box.left) + "px",
        "--height": (box.bottom - box.top) + "px",
      }}
    >
      {interactive && (element.type === "line"
        ? <LineHandles element={element} updateElement={updateElement} box={box} />
        : <BoxHandles element={element} updateElement={updateElement} />)}
    </div>
  )
}

// Attaches a pointer drag to the box container that translates all four corners.
function useBodyDrag(element, updateElement, interactive) {
  const ref = useRef(null)
  const origin = useRef(null)

  usePointer(ref, {
    active: interactive,
    cursor: "move",
    onDown: () => { origin.current = element.properties },
    onMove: (p) => {
      if (!p.hasDragged) return
      const o = origin.current
      const dx = p.x - p.startX
      const dy = p.y - p.startY
      updateElement(element.uuid, {
        startX: o.startX + dx, startY: o.startY + dy,
        endX: o.endX + dx, endY: o.endY + dy,
      })
    },
  })

  return ref
}

function BoxHandles({ element, updateElement }) {
  return HANDLES.map((h) => (
    <BoxHandle key={h.pos} spec={h} element={element} updateElement={updateElement} />
  ))
}

function BoxHandle({ spec, element, updateElement }) {
  const ref = useRef(null)
  const origin = useRef(null)   // normalized box snapshotted at drag start
  const off = handleOffset(spec.pos)

  usePointer(ref, {
    active: true,
    cursor: spec.cursor,
    onDown: () => { origin.current = boxOf(element.properties) },
    onMove: (p) => {
      if (!p.hasDragged) return
      updateElement(
        element.uuid,
        resize(origin.current, spec.edges, p.x - p.startX, p.y - p.startY, p.shiftKey)
      )
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

// Lines get one handle per endpoint, dragging the endpoint directly so the
// start→end direction (and therefore angle/arrowheads) is preserved. No
// normalization, so endpoints never swap.
function LineHandles({ element, updateElement, box }) {
  const p = element.properties
  return (
    <>
      <LineHandle
        element={element} updateElement={updateElement} box={box}
        keyX="startX" keyY="startY" x={p.startX} y={p.startY}
      />
      <LineHandle
        element={element} updateElement={updateElement} box={box}
        keyX="endX" keyY="endY" x={p.endX} y={p.endY}
      />
    </>
  )
}

function LineHandle({ element, updateElement, box, keyX, keyY, x, y }) {
  const ref = useRef(null)
  const origin = useRef(null)

  usePointer(ref, {
    active: true,
    cursor: "move",
    onDown: () => { origin.current = { x: element.properties[keyX], y: element.properties[keyY] } },
    onMove: (p) => {
      if (!p.hasDragged) return
      updateElement(element.uuid, {
        [keyX]: origin.current.x + (p.x - p.startX),
        [keyY]: origin.current.y + (p.y - p.startY),
      })
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
