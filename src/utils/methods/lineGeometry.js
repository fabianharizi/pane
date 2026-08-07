// Routing and binding for line elements. Lines are connectors: either endpoint
// may be BOUND to another element's edge — the binding stores `{ uuid, side }`
// and the endpoint glues to that side's midpoint (a fixed edge anchor that
// tracks the target through move/resize/rotate). Bindings are resolved at READ
// time: the stored coords of a bound end are only a fallback/cache, and every
// reader (render, bounds, marquee, panel) derives the effective endpoints from
// the target's current geometry. Nothing here touches React or the DOM.
//
// The shared primitives this is built on (rad/deg/rotatePoint/bboxOf) live in
// utils/geometry — they aren't line-specific and every kind of element needs them.

import { rad, rotatePoint, bboxOf } from "../geometry/primitives"

// Outward unit normals of each side, in the element's local (unrotated) frame.
const NORMALS = {
  top:    { x: 0, y: -1 },
  right:  { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left:   { x: -1, y: 0 },
}

// World-space anchor of a binding side: the side's midpoint on the element's
// bounding box, rotated with the element about its center. Side midpoints lie
// exactly on an oval's border, so ovals need no special case.
export function anchorPoint(element, side) {
  const box = bboxOf(element.properties)
  const c = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 }
  const mid = {
    top:    { x: c.x, y: box.top },
    right:  { x: box.right, y: c.y },
    bottom: { x: c.x, y: box.bottom },
    left:   { x: box.left, y: c.y },
  }[side]
  const rotation = element.properties.rotation ?? 0
  return rotation ? rotatePoint(mid, c, rotation) : mid
}

// The direction a route leaves a bound side with: the side normal, rotated with
// the target (used by curved routing; elbow stays axis-aligned by design).
const sideDir = (side, rotation) => {
  const n = NORMALS[side]
  if (!rotation) return n
  const a = rad(rotation)
  return {
    x: n.x * Math.cos(a) - n.y * Math.sin(a),
    y: n.x * Math.sin(a) + n.y * Math.cos(a),
  }
}

// Effective endpoints of a line. `lookup(uuid) → element | undefined` supplies
// binding targets (pass `getElement`, or a closure over a Map). A missing or
// dangling binding falls back to the stored coords — deleteElements bakes
// coords before detaching, so dangling bindings shouldn't occur in practice.
export function resolveLineEndpoints(properties, lookup) {
  const resolve = (binding, x, y) => {
    const target = binding ? lookup(binding.uuid) : undefined
    if (!target) return { x, y, side: null, dir: null }
    const a = anchorPoint(target, binding.side)
    return { x: a.x, y: a.y, side: binding.side, dir: sideDir(binding.side, target.properties.rotation ?? 0) }
  }
  const s = resolve(properties.startBinding, properties.startX, properties.startY)
  const e = resolve(properties.endBinding, properties.endX, properties.endY)
  return {
    startX: s.x, startY: s.y, endX: e.x, endY: e.y,
    startSide: s.side, endSide: e.side,
    startDir: s.dir, endDir: e.dir,
  }
}

const clampNum = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

const normalize = (dx, dy) => {
  const len = Math.hypot(dx, dy)
  return len < 1e-6 ? null : { x: dx / len, y: dy / len }
}

// How far an elbow route stubs straight out of a bound side before turning.
const ELBOW_STUB = 20

// How far an UNBOUND curved end leans off the straight path, as a fraction of
// its control reach. An unbound end has no side to leave from, and aiming its
// control point straight along the segment collapses the curve into a line —
// this is the perpendicular blended in to keep it visibly curved. Higher = bowier.
const UNBOUND_BOW = 0.5

// Axis direction an elbow leaves an endpoint with: the bound side's unrotated
// normal, or (unbound) the dominant axis toward the other endpoint.
const elbowDir = (side, from, toward) => {
  if (side) return NORMALS[side]
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  return Math.abs(dx) >= Math.abs(dy)
    ? { x: Math.sign(dx) || 1, y: 0 }
    : { x: 0, y: Math.sign(dy) || 1 }
}

const dedupe = (pts) => pts.filter((p, i) => i === 0 || Math.abs(p.x - pts[i - 1].x) > 1e-6 || Math.abs(p.y - pts[i - 1].y) > 1e-6)

// Build the route for a resolved line:
//   straight → { kind: "polyline", pts: [p0, p1] }
//   elbow    → { kind: "polyline", pts: [...] } (orthogonal, simple midpoint
//               routing, no obstacle avoidance)
//   curved   → { kind: "cubic", pts: [p0, c1, c2, p1] } — the curve stays inside
//              its control hull, so `pts` also bounds the bbox.
export function buildRoute(resolved, routing) {
  const p0 = { x: resolved.startX, y: resolved.startY }
  const p1 = { x: resolved.endX, y: resolved.endY }

  if (routing === "curved") {
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y)
    const reach = clampNum(dist / 2, 30, 200)
    const seg = normalize(p1.x - p0.x, p1.y - p0.y) ?? { x: 1, y: 0 }

    // Both unbound ends lean toward the SAME perpendicular side, which bows the
    // curve symmetrically. (Leaning them opposite ways would S-bend it; leaning
    // neither — the old behaviour — drew a straight line.) A bound end ignores
    // this and leaves along its side's outward normal, as before.
    const perp = { x: -seg.y, y: seg.x }
    const bowed = (along) =>
      normalize(along.x + perp.x * UNBOUND_BOW, along.y + perp.y * UNBOUND_BOW) ?? along

    const d0 = resolved.startDir ?? bowed(seg)
    const d1 = resolved.endDir ?? bowed({ x: -seg.x, y: -seg.y })
    return {
      kind: "cubic",
      pts: [
        p0,
        { x: p0.x + d0.x * reach, y: p0.y + d0.y * reach },
        { x: p1.x + d1.x * reach, y: p1.y + d1.y * reach },
        p1,
      ],
    }
  }

  if (routing === "elbow") {
    const d0 = elbowDir(resolved.startSide, p0, p1)
    const d1 = elbowDir(resolved.endSide, p1, p0)
    const a0 = { x: p0.x + d0.x * ELBOW_STUB, y: p0.y + d0.y * ELBOW_STUB }
    const a1 = { x: p1.x + d1.x * ELBOW_STUB, y: p1.y + d1.y * ELBOW_STUB }

    // Connect the stub ends orthogonally: parallel stubs jog through the
    // midline; perpendicular stubs meet at the shared corner.
    let bends
    if (d0.x !== 0 && d1.x !== 0) {
      const midX = (a0.x + a1.x) / 2
      bends = [{ x: midX, y: a0.y }, { x: midX, y: a1.y }]
    } else if (d0.y !== 0 && d1.y !== 0) {
      const midY = (a0.y + a1.y) / 2
      bends = [{ x: a0.x, y: midY }, { x: a1.x, y: midY }]
    } else if (d0.x !== 0) {
      bends = [{ x: a1.x, y: a0.y }]
    } else {
      bends = [{ x: a0.x, y: a1.y }]
    }

    return { kind: "polyline", pts: dedupe([p0, a0, ...bends, a1, p1]) }
  }

  return { kind: "polyline", pts: [p0, p1] }
}

// Arrowhead sizing follows the stroke so heads stay proportionate.
const arrowLength = (strokeWidth) => Math.max(9, 3.5 * strokeWidth)

// A filled triangle at `tip`, pointing away from `from`: [tip, corner, corner].
const arrowTriangle = (tip, from, len) => {
  const u = normalize(tip.x - from.x, tip.y - from.y)
  if (!u) return null
  const base = { x: tip.x - u.x * len, y: tip.y - u.y * len }
  const w = len * 0.45
  return [
    tip,
    { x: base.x - u.y * w, y: base.y + u.x * w },
    { x: base.x + u.y * w, y: base.y - u.x * w },
  ]
}

// Pull a route endpoint back toward its neighbor so the stroke doesn't poke
// through an arrow tip drawn on top of it.
const pullBack = (tip, from, by) => {
  const u = normalize(tip.x - from.x, tip.y - from.y)
  return u ? { x: tip.x - u.x * by, y: tip.y - u.y * by } : tip
}

// Apply arrowheads to a route: returns a (possibly shortened) copy of the route
// plus the triangles to fill. The tangent at each tip comes from the adjacent
// route point — for cubics that's the neighboring control point.
export function decorateRoute(route, { headStart, headEnd, strokeWidth = 2 }) {
  const pts = route.pts.map(p => ({ ...p }))
  const len = arrowLength(strokeWidth)
  const arrows = []

  if (headStart === "arrow") {
    const tri = arrowTriangle(pts[0], pts[1], len)
    if (tri) {
      arrows.push(tri)
      pts[0] = pullBack(pts[0], pts[1], len * 0.85)
    }
  }
  if (headEnd === "arrow") {
    const last = pts.length - 1
    const tri = arrowTriangle(pts[last], pts[last - 1], len)
    if (tri) {
      arrows.push(tri)
      pts[last] = pullBack(pts[last], pts[last - 1], len * 0.85)
    }
  }

  return { route: { kind: route.kind, pts }, arrows }
}

// Bounding box over a decorated route (control points bound a cubic, so route
// points alone are a safe cover). The svg positions itself here and renders
// with overflow visible, so no padding is needed.
export function routeBounds(route, arrows) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  for (const p of [...route.pts, ...arrows.flat()]) {
    left = Math.min(left, p.x); top = Math.min(top, p.y)
    right = Math.max(right, p.x); bottom = Math.max(bottom, p.y)
  }
  return { left, top, right, bottom }
}

// SVG path string for a route, in coordinates relative to (ox, oy).
export function pathD(route, ox = 0, oy = 0) {
  const at = (p) => `${p.x - ox} ${p.y - oy}`
  if (route.kind === "cubic") {
    const [p0, c1, c2, p1] = route.pts
    return `M ${at(p0)} C ${at(c1)}, ${at(c2)}, ${at(p1)}`
  }
  return route.pts.map((p, i) => `${i ? "L" : "M"} ${at(p)}`).join(" ")
}

// Path string for one arrow triangle, relative to (ox, oy).
export const trianglePathD = (tri, ox = 0, oy = 0) =>
  `M ${tri[0].x - ox} ${tri[0].y - oy} L ${tri[1].x - ox} ${tri[1].y - oy} L ${tri[2].x - ox} ${tri[2].y - oy} Z`
