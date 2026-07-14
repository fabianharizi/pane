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

// Bounding box over every element's raw corners (world coords). One element is
// just a group of one — same math for any count. NOTE: deliberately ignores
// per-element rotation (uses the unrotated footprint) — see CLAUDE.md.
const boundsOf = (elements) => elements.reduce((b, el) => {
  const { startX, startY, endX, endY } = el.properties
  return {
    left: Math.min(b.left, startX, endX),
    top: Math.min(b.top, startY, endY),
    right: Math.max(b.right, startX, endX),
    bottom: Math.max(b.bottom, startY, endY),
  }
}, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity })

// Angle helpers. Rotation is stored in degrees, about the element center.
const rad = (d) => d * Math.PI / 180
const deg = (r) => r * 180 / Math.PI
const snap15 = (d) => Math.round(d / 15) * 15

// Rotate point p about center c by `degrees`.
const rotatePoint = (p, c, degrees) => {
  const a = rad(degrees)
  const dx = p.x - c.x
  const dy = p.y - c.y
  return {
    x: c.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: c.y + dx * Math.sin(a) + dy * Math.cos(a),
  }
}

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

// `interactive` gates all dragging: only the select tool may resize/move/rotate.
// `zoom` converts pointer deltas (screen px) into world units; `toWorld` converts
// absolute pointer positions (needed for rotation angles).
export default function SelectionBox({ elements, zoom, toWorld, updateElements, interactive }) {
  const box = boundsOf(elements)

  // Body-drag: dragging the container interior moves the whole selection.
  const bodyRef = useBodyDrag(elements, zoom, updateElements, interactive)

  // Endpoint handles are a line-type affordance (endpoint identity is per-line,
  // meaningless on a group), so they apply to a lone selected line only.
  const loneLine = elements.length === 1 && elements[0].type === "line" ? elements[0] : null

  // A lone box element rotates the whole chrome with it, so resize handles work
  // in the element's local frame. Groups keep an axis-aligned box (rotation 0).
  const rotation = !loneLine && elements.length === 1 ? (elements[0].properties.rotation ?? 0) : 0

  return (
    <div
      className={interactive ? `${styles.box} ${styles.interactive}` : styles.box}
      ref={bodyRef}
      style={{
        "--x": box.left + "px",
        "--y": box.top + "px",
        "--width": (box.right - box.left) + "px",
        "--height": (box.bottom - box.top) + "px",
        "--rotation": rotation + "deg",
      }}
    >
      {interactive && (loneLine
        ? <LineHandles element={loneLine} zoom={zoom} updateElements={updateElements} box={box} />
        : <>
            {HANDLES.map((h) => (
              <BoxHandle key={h.pos} spec={h} elements={elements} zoom={zoom} rotation={rotation} updateElements={updateElements} />
            ))}
            <RotateHandle elements={elements} toWorld={toWorld} updateElements={updateElements} />
          </>)}
    </div>
  )
}

// Attaches a pointer drag to the box container that translates every selected
// element together. Pointer deltas are screen px → divide by zoom for world.
// Translation is rotation-independent, so rotated chrome needs no special case.
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
function BoxHandle({ spec, elements, zoom, rotation, updateElements }) {
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
        rotation,
      }
    },
    onMove: (p) => {
      if (!p.hasDragged) return
      const o = origin.current

      // Screen deltas → world. For a rotated lone element the handles live in
      // the element's rotated (local) frame, so rotate the delta back by
      // −rotation before applying it to the local box edges.
      let dx = (p.x - p.startX) / zoom
      let dy = (p.y - p.startY) / zoom
      if (o.rotation) {
        const a = rad(-o.rotation)
        const rx = dx * Math.cos(a) - dy * Math.sin(a)
        const ry = dx * Math.sin(a) + dy * Math.cos(a)
        dx = rx
        dy = ry
      }

      // The minimum size is a constant 10 SCREEN px at any zoom.
      let next = resizeBox(o.box, spec.edges, dx, dy, p.shiftKey, MIN_SIZE / zoom)

      // Rotation pivots about the element CENTER, and resizing moves the center
      // — which would silently swing the anchored corner through the rotation.
      // Compensate: translate the new box so the anchor stays fixed in world
      // space (anchor world drift = Δcenter − R(rotation)·Δcenter).
      if (o.rotation) {
        const a = rad(o.rotation)
        const dcx = (next.left + next.right) / 2 - (o.box.left + o.box.right) / 2
        const dcy = (next.top + next.bottom) / 2 - (o.box.top + o.box.bottom) / 2
        const driftX = dcx - (dcx * Math.cos(a) - dcy * Math.sin(a))
        const driftY = dcy - (dcx * Math.sin(a) + dcy * Math.cos(a))
        next = {
          left: next.left - driftX, right: next.right - driftX,
          top: next.top - driftY, bottom: next.bottom - driftY,
        }
      }

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

// The rotate handle (dot above the top edge). Dragging it rotates the whole
// selection about the group center — one code path for any count: a single box
// element's group center IS its own center, so only its `rotation` changes.
// Box members orbit the center (corners translate, size intact) and accumulate
// `rotation`; line members have no rotation property — their endpoints rotate,
// which IS their rotation. Shift snaps to 15°: a single element snaps its
// resulting angle, a group snaps the drag delta (a group has no single angle).
function RotateHandle({ elements, toWorld, updateElements }) {
  const ref = useRef(null)
  const origin = useRef(null)

  usePointer(ref, {
    active: true,
    cursor: "grab",
    onDown: (p) => {
      const box = boundsOf(elements)
      const center = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }
      const pw = toWorld(p.x, p.y)
      origin.current = {
        center,
        startAngle: deg(Math.atan2(pw.y - center.y, pw.x - center.x)),
        members: elements.map(el => ({ uuid: el.uuid, type: el.type, ...el.properties })),
        single: elements.length === 1 && elements[0].type !== "line",
      }
    },
    onMove: (p) => {
      if (!p.hasDragged) return
      const o = origin.current
      const pw = toWorld(p.x, p.y)
      let delta = deg(Math.atan2(pw.y - o.center.y, pw.x - o.center.x)) - o.startAngle

      if (p.shiftKey) {
        delta = o.single
          ? snap15((o.members[0].rotation ?? 0) + delta) - (o.members[0].rotation ?? 0)
          : snap15(delta)
      }

      updateElements(o.members.map(m => {
        if (m.type === "line") {
          const s = rotatePoint({ x: m.startX, y: m.startY }, o.center, delta)
          const e = rotatePoint({ x: m.endX, y: m.endY }, o.center, delta)
          return { uuid: m.uuid, properties: { startX: s.x, startY: s.y, endX: e.x, endY: e.y } }
        }

        // Box member: its center orbits the group center; its size is intact.
        const c = { x: (m.startX + m.endX) / 2, y: (m.startY + m.endY) / 2 }
        const c2 = rotatePoint(c, o.center, delta)
        const dx = c2.x - c.x
        const dy = c2.y - c.y
        return {
          uuid: m.uuid,
          properties: {
            startX: m.startX + dx, startY: m.startY + dy,
            endX: m.endX + dx, endY: m.endY + dy,
            // Whole degrees: plenty for hand-rotation, keeps the panel readable.
            rotation: Math.round((m.rotation ?? 0) + delta),
          }
        }
      }))
    },
  })

  return <span className={styles.rotateHandle} ref={ref} data-handle="rotate" />
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
