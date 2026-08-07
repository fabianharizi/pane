import { describe, it, expect } from "vitest"
import { rad, deg, rotatePoint, bboxOf, centerOf, mapCoord } from "./primitives"

// Rotation is never asserted exactly. Math.cos(Math.PI / 2) is 6.12e-17, not 0,
// so a 90° turn leaves float residue in every coordinate — `toBeCloseTo`
// throughout, never `toEqual`.

const expectPoint = (actual, { x, y }) => {
  expect(actual.x).toBeCloseTo(x)
  expect(actual.y).toBeCloseTo(y)
}

describe("rad / deg", () => {
  it("converts the cardinal angles", () => {
    expect(rad(0)).toBe(0)
    expect(rad(180)).toBeCloseTo(Math.PI)
    expect(deg(Math.PI)).toBeCloseTo(180)
    expect(deg(Math.PI / 2)).toBeCloseTo(90)
  })

  it("round-trips", () => {
    for (const d of [0, 1, 45, 90, 180, 359, -90, 720]) {
      expect(deg(rad(d))).toBeCloseTo(d)
    }
  })

  it("does not wrap angles into a range", () => {
    // Callers rely on this: SelectionBox accumulates rotation past 360.
    expect(rad(720)).toBeCloseTo(4 * Math.PI)
    expect(deg(rad(-90))).toBeCloseTo(-90)
  })
})

describe("rotatePoint", () => {
  const c = { x: 0, y: 0 }

  it("is the identity at 0°", () => {
    expectPoint(rotatePoint({ x: 10, y: 5 }, c, 0), { x: 10, y: 5 })
  })

  it("rotates clockwise in screen space (y down)", () => {
    expectPoint(rotatePoint({ x: 10, y: 0 }, c, 90), { x: 0, y: 10 })
    expectPoint(rotatePoint({ x: 10, y: 0 }, c, 180), { x: -10, y: 0 })
    expectPoint(rotatePoint({ x: 10, y: 0 }, c, -90), { x: 0, y: -10 })
  })

  it("rotates about an arbitrary centre", () => {
    expectPoint(rotatePoint({ x: 20, y: 10 }, { x: 10, y: 10 }, 90), { x: 10, y: 20 })
  })

  it("returns the centre when the point IS the centre", () => {
    expect(rotatePoint({ x: 7, y: 7 }, { x: 7, y: 7 }, 137)).toEqual({ x: 7, y: 7 })
  })

  it("does not mutate its arguments", () => {
    const p = { x: 1, y: 2 }
    const centre = { x: 3, y: 4 }
    rotatePoint(p, centre, 45)
    expect(p).toEqual({ x: 1, y: 2 })
    expect(centre).toEqual({ x: 3, y: 4 })
  })

  it("returns only x and y, dropping any extra keys on the input", () => {
    const out = rotatePoint({ x: 1, y: 2, side: "top" }, c, 10)
    expect(Object.keys(out).sort()).toEqual(["x", "y"])
  })
})

describe("bboxOf", () => {
  it("normalises corners drawn in any direction", () => {
    const expected = { left: 0, top: 0, right: 100, bottom: 50 }
    expect(bboxOf({ startX: 0, startY: 0, endX: 100, endY: 50 })).toEqual(expected)
    expect(bboxOf({ startX: 100, startY: 50, endX: 0, endY: 0 })).toEqual(expected)
    expect(bboxOf({ startX: 0, startY: 50, endX: 100, endY: 0 })).toEqual(expected)
  })

  it("returns a zero-area box for coincident corners", () => {
    expect(bboxOf({ startX: 7, startY: 7, endX: 7, endY: 7 }))
      .toEqual({ left: 7, top: 7, right: 7, bottom: 7 })
  })
})

describe("centerOf", () => {
  it("averages the stored corners", () => {
    expect(centerOf({ startX: 0, startY: 0, endX: 100, endY: 50 })).toEqual({ x: 50, y: 25 })
  })

  it("is unaffected by corner order", () => {
    expect(centerOf({ startX: 100, startY: 50, endX: 0, endY: 0 })).toEqual({ x: 50, y: 25 })
  })

  it("handles negative world coordinates", () => {
    expect(centerOf({ startX: -100, startY: -40, endX: -20, endY: -20 })).toEqual({ x: -60, y: -30 })
  })
})

describe("mapCoord", () => {
  it("maps proportionally from the old box onto the new", () => {
    // Old span 0..100, new span 0..200: everything doubles.
    expect(mapCoord(0, 0, 100, 0, 200)).toBe(0)
    expect(mapCoord(50, 0, 100, 0, 200)).toBe(100)
    expect(mapCoord(100, 0, 100, 0, 200)).toBe(200)
  })

  it("carries the new origin", () => {
    expect(mapCoord(50, 0, 100, 10, 100)).toBe(60)
  })

  it("preserves direction by mapping raw (unnormalised) coordinates", () => {
    // A segment stored end-before-start must stay end-before-start.
    const a = mapCoord(100, 0, 100, 0, 200)
    const b = mapCoord(0, 0, 100, 0, 200)
    expect(a).toBeGreaterThan(b)
  })

  it("degenerates to a pure translation on a zero-size axis", () => {
    // No ratio exists, so the coordinate just shifts by the origin delta.
    expect(mapCoord(42, 10, 0, 30, 500)).toBe(62)
    expect(mapCoord(42, 10, 0, 0, 0)).toBe(32)
  })

  it("handles a mirrored new box", () => {
    // newSize negative flips the mapping — used by nothing today, but the
    // arithmetic must not special-case it.
    expect(mapCoord(0, 0, 100, 100, -100)).toBe(100)
    expect(mapCoord(100, 0, 100, 100, -100)).toBe(0)
  })
})
