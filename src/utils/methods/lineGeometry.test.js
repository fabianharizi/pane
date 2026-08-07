import { describe, it, expect, vi } from "vitest"
import {
  anchorPoint, resolveLineEndpoints,
  buildRoute, decorateRoute, routeBounds, pathD, trianglePathD,
} from "./lineGeometry"

// Characterisation tests: these lock in what the module does TODAY, ahead of the
// geometry extraction. They are the safety net for that refactor, so a test that
// needs editing during it means behaviour changed and wants justifying.
//
// Rotation is never asserted exactly. Math.cos(Math.PI / 2) is 6.12e-17, not 0,
// so a 90° rotation leaves float residue in every coordinate — `toBeCloseTo`
// throughout, never `toEqual`.

// A box element as the rest of the app stores one: two opposite corners.
const boxAt = (startX, startY, endX, endY, rotation) => ({
  uuid: "box-1",
  type: "rectangle",
  properties: { startX, startY, endX, endY, ...(rotation === undefined ? {} : { rotation }) },
})

const expectPoint = (actual, { x, y }) => {
  expect(actual.x).toBeCloseTo(x)
  expect(actual.y).toBeCloseTo(y)
}

describe("anchorPoint", () => {
  // 100x50 box from (0,0) to (100,50); centre (50,25).
  const box = boxAt(0, 0, 100, 50)

  it("returns each side's midpoint", () => {
    expectPoint(anchorPoint(box, "top"), { x: 50, y: 0 })
    expectPoint(anchorPoint(box, "right"), { x: 100, y: 25 })
    expectPoint(anchorPoint(box, "bottom"), { x: 50, y: 50 })
    expectPoint(anchorPoint(box, "left"), { x: 0, y: 25 })
  })

  it("normalises inverted corners", () => {
    // Stored end-before-start must give the same anchors.
    const inverted = boxAt(100, 50, 0, 0)
    for (const side of ["top", "right", "bottom", "left"]) {
      expectPoint(anchorPoint(inverted, side), anchorPoint(box, side))
    }
  })

  it("collapses all four anchors onto one point for a zero-area box", () => {
    const dot = boxAt(10, 10, 10, 10)
    for (const side of ["top", "right", "bottom", "left"]) {
      expectPoint(anchorPoint(dot, side), { x: 10, y: 10 })
    }
  })

  it("handles a zero-width box (left and right collapse onto the centre line)", () => {
    const vertical = boxAt(10, 0, 10, 40)
    expectPoint(anchorPoint(vertical, "left"), { x: 10, y: 20 })
    expectPoint(anchorPoint(vertical, "right"), { x: 10, y: 20 })
    expectPoint(anchorPoint(vertical, "top"), { x: 10, y: 0 })
  })

  it("treats rotation of 0, undefined and null identically", () => {
    const zero = boxAt(0, 0, 100, 50, 0)
    const absent = boxAt(0, 0, 100, 50)
    const nul = boxAt(0, 0, 100, 50, null)
    for (const side of ["top", "right", "bottom", "left"]) {
      expectPoint(anchorPoint(zero, side), anchorPoint(absent, side))
      expectPoint(anchorPoint(nul, side), anchorPoint(absent, side))
    }
  })

  it("rotates the anchor with the element", () => {
    // Square, so a 90° turn maps each side's midpoint onto the next side's.
    const square = boxAt(0, 0, 100, 100, 90)
    expectPoint(anchorPoint(square, "top"), { x: 100, y: 50 })     // top → right
    expectPoint(anchorPoint(square, "right"), { x: 50, y: 100 })   // right → bottom
    expectPoint(anchorPoint(square, "bottom"), { x: 0, y: 50 })    // bottom → left
    expectPoint(anchorPoint(square, "left"), { x: 50, y: 0 })      // left → top
  })

  it("does not mutate the element", () => {
    const el = boxAt(0, 0, 100, 50, 30)
    const before = JSON.parse(JSON.stringify(el))
    anchorPoint(el, "top")
    expect(el).toEqual(before)
  })
})

describe("resolveLineEndpoints", () => {
  const target = boxAt(0, 0, 100, 50)
  const lookupOf = (el) => (uuid) => (uuid === el.uuid ? el : undefined)

  const unbound = { startX: 1, startY: 2, endX: 3, endY: 4 }

  it("returns exactly the eight keys callers spread over stored properties", () => {
    const out = resolveLineEndpoints(unbound, () => undefined)
    expect(Object.keys(out).sort()).toEqual([
      "endDir", "endSide", "endX", "endY",
      "startDir", "startSide", "startX", "startY",
    ])
  })

  it("passes stored coords straight through when nothing is bound", () => {
    const lookup = vi.fn()
    const out = resolveLineEndpoints(unbound, lookup)
    expect(out).toEqual({
      startX: 1, startY: 2, endX: 3, endY: 4,
      startSide: null, endSide: null, startDir: null, endDir: null,
    })
    // Short-circuits before calling lookup at all — a falsy binding never hits it.
    expect(lookup).not.toHaveBeenCalled()
  })

  it("resolves a bound start to the target's side anchor", () => {
    const out = resolveLineEndpoints(
      { ...unbound, startBinding: { uuid: "box-1", side: "right" } },
      lookupOf(target),
    )
    expectPoint({ x: out.startX, y: out.startY }, { x: 100, y: 25 })
    expect(out.startSide).toBe("right")
    expect(out.startDir).toEqual({ x: 1, y: 0 })
    // The unbound end is untouched.
    expect(out.endX).toBe(3)
    expect(out.endSide).toBeNull()
  })

  it("resolves both ends independently", () => {
    const out = resolveLineEndpoints(
      {
        ...unbound,
        startBinding: { uuid: "box-1", side: "left" },
        endBinding: { uuid: "box-1", side: "right" },
      },
      lookupOf(target),
    )
    expectPoint({ x: out.startX, y: out.startY }, { x: 0, y: 25 })
    expectPoint({ x: out.endX, y: out.endY }, { x: 100, y: 25 })
  })

  it("falls back to stored coords when a binding dangles, discarding the side", () => {
    const out = resolveLineEndpoints(
      { ...unbound, startBinding: { uuid: "gone", side: "top" } },
      () => undefined,
    )
    expect(out.startX).toBe(1)
    expect(out.startY).toBe(2)
    expect(out.startSide).toBeNull()
    expect(out.startDir).toBeNull()
  })

  it("rotates the leave direction with a rotated target", () => {
    const rotated = boxAt(0, 0, 100, 100, 90)
    const out = resolveLineEndpoints(
      { ...unbound, startBinding: { uuid: "box-1", side: "right" } },
      lookupOf(rotated),
    )
    // The right side's outward normal (1,0) turns to point down.
    expect(out.startDir.x).toBeCloseTo(0)
    expect(out.startDir.y).toBeCloseTo(1)
  })

  it("does not mutate the properties it is given", () => {
    const props = { ...unbound, startBinding: { uuid: "box-1", side: "top" } }
    const before = JSON.parse(JSON.stringify(props))
    resolveLineEndpoints(props, lookupOf(target))
    expect(props).toEqual(before)
  })
})

describe("buildRoute", () => {
  const ends = { startX: 0, startY: 0, endX: 100, endY: 0 }

  describe("straight (and unknown routings)", () => {
    it("is just the two endpoints", () => {
      expect(buildRoute(ends, "straight")).toEqual({
        kind: "polyline",
        pts: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      })
    })

    it("treats an unrecognised routing as straight", () => {
      expect(buildRoute(ends, "squiggle").pts).toHaveLength(2)
      expect(buildRoute(ends, undefined).kind).toBe("polyline")
    })
  })

  describe("curved", () => {
    it("is a cubic with four points", () => {
      const r = buildRoute({ ...ends, startDir: null, endDir: null }, "curved")
      expect(r.kind).toBe("cubic")
      expect(r.pts).toHaveLength(4)
      expect(r.pts[0]).toEqual({ x: 0, y: 0 })
      expect(r.pts[3]).toEqual({ x: 100, y: 0 })
    })

    it("clamps the control reach to a 30px floor", () => {
      // dist 10 → dist/2 = 5 → clamped up to 30.
      const r = buildRoute({ startX: 0, startY: 0, endX: 10, endY: 0 }, "curved")
      const reach = Math.hypot(r.pts[1].x - r.pts[0].x, r.pts[1].y - r.pts[0].y)
      expect(reach).toBeCloseTo(30)
    })

    it("clamps the control reach to a 200px ceiling", () => {
      // dist 1000 → dist/2 = 500 → clamped down to 200.
      const r = buildRoute({ startX: 0, startY: 0, endX: 1000, endY: 0 }, "curved")
      const reach = Math.hypot(r.pts[1].x - r.pts[0].x, r.pts[1].y - r.pts[0].y)
      expect(reach).toBeCloseTo(200)
    })

    it("still produces a real curve for a zero-length line", () => {
      // normalize() returns null for a degenerate segment, so `seg` falls back
      // to (1,0) and the reach clamps to its 30px floor — no NaN.
      const r = buildRoute({ startX: 5, startY: 5, endX: 5, endY: 5 }, "curved")
      expect(r.kind).toBe("cubic")
      for (const p of r.pts) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      }
    })

    it("bows both unbound ends to the same side, so the curve is symmetric", () => {
      const r = buildRoute(ends, "curved")
      // Horizontal line, so a symmetric bow puts both controls off-axis the
      // same way and mirrored in x about the midpoint.
      expect(Math.sign(r.pts[1].y)).toBe(Math.sign(r.pts[2].y))
      expect(r.pts[1].y).toBeCloseTo(r.pts[2].y)
    })

    it("leaves a bound end along its side normal instead of bowing", () => {
      const r = buildRoute({ ...ends, startDir: { x: 0, y: -1 } }, "curved")
      // Control point straight up from the start, by the full reach.
      expectPoint(r.pts[1], { x: 0, y: -50 })
    })

    it("keeps the curve inside its control hull", () => {
      // The bbox claim routeBounds relies on: sample the Bezier and check.
      const r = buildRoute(ends, "curved")
      const [p0, c1, c2, p1] = r.pts
      const hull = routeBounds(r, [])
      for (let t = 0; t <= 1; t += 0.05) {
        const u = 1 - t
        const x = u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x
        const y = u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y
        expect(x).toBeGreaterThanOrEqual(hull.left - 1e-9)
        expect(x).toBeLessThanOrEqual(hull.right + 1e-9)
        expect(y).toBeGreaterThanOrEqual(hull.top - 1e-9)
        expect(y).toBeLessThanOrEqual(hull.bottom + 1e-9)
      }
    })
  })

  describe("elbow", () => {
    it("stubs 20px out of each bound side, then jogs through the midline", () => {
      // Both stubs horizontal (right out of one, left out of the other).
      const r = buildRoute(
        { startX: 0, startY: 0, endX: 100, endY: 50, startSide: "right", endSide: "left" },
        "elbow",
      )
      expect(r.kind).toBe("polyline")
      expect(r.pts[0]).toEqual({ x: 0, y: 0 })
      expect(r.pts[1]).toEqual({ x: 20, y: 0 })          // stub out of "right"
      expect(r.pts[r.pts.length - 1]).toEqual({ x: 100, y: 50 })
      // Every leg is axis-aligned.
      for (let i = 1; i < r.pts.length; i++) {
        const dx = Math.abs(r.pts[i].x - r.pts[i - 1].x)
        const dy = Math.abs(r.pts[i].y - r.pts[i - 1].y)
        expect(dx < 1e-6 || dy < 1e-6).toBe(true)
      }
    })

    it("jogs through the horizontal midline when both stubs are vertical", () => {
      const r = buildRoute(
        { startX: 0, startY: 0, endX: 100, endY: 100, startSide: "bottom", endSide: "top" },
        "elbow",
      )
      expect(r.pts[1]).toEqual({ x: 0, y: 20 })
      const midY = (20 + 80) / 2
      expect(r.pts.some(p => Math.abs(p.y - midY) < 1e-6)).toBe(true)
    })

    it("meets at a single corner when the stubs are perpendicular", () => {
      const r = buildRoute(
        { startX: 0, startY: 0, endX: 100, endY: 100, startSide: "right", endSide: "top" },
        "elbow",
      )
      // p0, a0, one bend, a1, p1
      expect(r.pts).toHaveLength(5)
    })

    it("sends an unbound end along the dominant axis toward the other", () => {
      const r = buildRoute({ startX: 0, startY: 0, endX: 100, endY: 10 }, "elbow")
      expect(r.pts[1]).toEqual({ x: 20, y: 0 })       // |dx| > |dy| → horizontal
    })

    it("breaks an axis tie horizontally, including at zero length", () => {
      const r = buildRoute({ startX: 0, startY: 0, endX: 0, endY: 0 }, "elbow")
      // Math.sign(0) || 1 → +1, so both ends leave rightward and dedupe collapses
      // the coincident bends.
      expect(r.pts).toEqual([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 0, y: 0 }])
    })
  })
})

describe("decorateRoute", () => {
  const straight = () => ({ kind: "polyline", pts: [{ x: 0, y: 0 }, { x: 100, y: 0 }] })

  it("returns the route unchanged when no heads are requested", () => {
    const { route, arrows } = decorateRoute(straight(), { headStart: "none", headEnd: "none" })
    expect(arrows).toEqual([])
    expect(route.pts).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }])
  })

  it("only the exact string \"arrow\" draws a head", () => {
    expect(decorateRoute(straight(), { headEnd: true }).arrows).toEqual([])
    expect(decorateRoute(straight(), { headEnd: "Arrow" }).arrows).toEqual([])
    expect(decorateRoute(straight(), { headEnd: "arrow" }).arrows).toHaveLength(1)
  })

  it("does not mutate the input route or its points", () => {
    const input = straight()
    const before = JSON.parse(JSON.stringify(input))
    decorateRoute(input, { headStart: "arrow", headEnd: "arrow" })
    expect(input).toEqual(before)
  })

  it("keeps the arrow tip at the ORIGINAL endpoint while pulling the stroke back", () => {
    // This aliasing is load-bearing: the head must sit at the true endpoint even
    // though pts[last] moves inward to hide the stroke under it.
    const { route, arrows } = decorateRoute(straight(), { headEnd: "arrow" })
    expect(arrows[0][0]).toEqual({ x: 100, y: 0 })
    expect(route.pts[1].x).toBeLessThan(100)
  })

  it("pushes the start arrow before the end arrow when both are present", () => {
    const { arrows } = decorateRoute(straight(), { headStart: "arrow", headEnd: "arrow" })
    expect(arrows).toHaveLength(2)
    expect(arrows[0][0]).toEqual({ x: 0, y: 0 })
    expect(arrows[1][0]).toEqual({ x: 100, y: 0 })
  })

  it("scales the head with stroke width, above a 9px floor", () => {
    const thin = decorateRoute(straight(), { headEnd: "arrow", strokeWidth: 1 })
    const thick = decorateRoute(straight(), { headEnd: "arrow", strokeWidth: 10 })
    const lengthOf = (tri) => Math.hypot(tri[0].x - (tri[1].x + tri[2].x) / 2, tri[0].y - (tri[1].y + tri[2].y) / 2)
    expect(lengthOf(thin.arrows[0])).toBeCloseTo(9)        // max(9, 3.5) → floor
    expect(lengthOf(thick.arrows[0])).toBeCloseTo(35)      // max(9, 35)
  })

  it("draws no head on a zero-length route rather than producing NaN", () => {
    const degenerate = { kind: "polyline", pts: [{ x: 5, y: 5 }, { x: 5, y: 5 }] }
    const { route, arrows } = decorateRoute(degenerate, { headStart: "arrow", headEnd: "arrow" })
    expect(arrows).toEqual([])
    expect(route.pts).toEqual([{ x: 5, y: 5 }, { x: 5, y: 5 }])
  })

  it("drops any extra keys on the input route, keeping only kind and pts", () => {
    const { route } = decorateRoute({ ...straight(), extra: 1 }, { headEnd: "none" })
    expect(Object.keys(route).sort()).toEqual(["kind", "pts"])
  })
})

describe("routeBounds", () => {
  it("covers the route points", () => {
    const route = { kind: "polyline", pts: [{ x: 10, y: 20 }, { x: 100, y: 5 }] }
    expect(routeBounds(route, [])).toEqual({ left: 10, top: 5, right: 100, bottom: 20 })
  })

  it("widens to include arrow triangles", () => {
    const route = { kind: "polyline", pts: [{ x: 0, y: 0 }, { x: 10, y: 0 }] }
    const arrows = [[{ x: 10, y: 0 }, { x: 5, y: -8 }, { x: 5, y: 8 }]]
    expect(routeBounds(route, arrows)).toEqual({ left: 0, top: -8, right: 10, bottom: 8 })
  })

  it("returns a zero-area box for a zero-length route", () => {
    // Line.jsx compensates with Math.max(1, ...) — the clamp lives there, not here.
    const route = { kind: "polyline", pts: [{ x: 3, y: 3 }, { x: 3, y: 3 }] }
    expect(routeBounds(route, [])).toEqual({ left: 3, top: 3, right: 3, bottom: 3 })
  })

  it("returns an inverted box for empty input", () => {
    expect(routeBounds({ pts: [] }, [])).toEqual({
      left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity,
    })
  })
})

describe("pathD", () => {
  it("writes a cubic as M + C", () => {
    const route = { kind: "cubic", pts: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }, { x: 30, y: 0 }] }
    expect(pathD(route)).toBe("M 0 0 C 10 0, 20 0, 30 0")
  })

  it("writes a polyline as M + L per point", () => {
    const route = { kind: "polyline", pts: [{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 5 }] }
    expect(pathD(route)).toBe("M 0 0 L 10 5 L 20 5")
  })

  it("subtracts the origin so the svg can draw in local coords", () => {
    const route = { kind: "polyline", pts: [{ x: 100, y: 50 }, { x: 120, y: 70 }] }
    expect(pathD(route, 100, 50)).toBe("M 0 0 L 20 20")
  })

  it("treats any non-cubic kind as a polyline", () => {
    const route = { kind: "whatever", pts: [{ x: 1, y: 2 }] }
    expect(pathD(route)).toBe("M 1 2")
  })

  it("returns an empty string for no points", () => {
    expect(pathD({ kind: "polyline", pts: [] })).toBe("")
  })
})

describe("trianglePathD", () => {
  const tri = [{ x: 10, y: 0 }, { x: 0, y: -5 }, { x: 0, y: 5 }]

  it("writes a closed three-point subpath", () => {
    expect(trianglePathD(tri)).toBe("M 10 0 L 0 -5 L 0 5 Z")
  })

  it("subtracts the origin", () => {
    expect(trianglePathD(tri, 10, 0)).toBe("M 0 0 L -10 -5 L -10 5 Z")
  })
})

describe("the Line.jsx render pipeline", () => {
  // Exactly what Line.jsx:29-30 runs, across the routing x head matrix.
  const props = {
    startX: 0, startY: 0, endX: 120, endY: 80,
    startSide: null, endSide: null, startDir: null, endDir: null,
    strokeWidth: 2,
  }

  for (const routing of ["straight", "curved", "elbow"]) {
    for (const [headStart, headEnd] of [["none", "none"], ["none", "arrow"], ["arrow", "arrow"]]) {
      it(`produces finite geometry for ${routing} / ${headStart} → ${headEnd}`, () => {
        const p = { ...props, routing, headStart, headEnd }
        const { route, arrows } = decorateRoute(buildRoute(p, p.routing), p)
        const b = routeBounds(route, arrows)

        for (const v of [b.left, b.top, b.right, b.bottom]) expect(Number.isFinite(v)).toBe(true)
        expect(b.right).toBeGreaterThanOrEqual(b.left)
        expect(b.bottom).toBeGreaterThanOrEqual(b.top)

        const d = pathD(route, b.left, b.top)
        expect(d).not.toContain("NaN")
        expect(d.startsWith("M ")).toBe(true)

        for (const tri of arrows) {
          expect(trianglePathD(tri, b.left, b.top)).not.toContain("NaN")
        }
      })
    }
  }
})
