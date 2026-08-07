import { describe, it, expect } from "vitest"
import box from "./box"
import segment from "./segment"
import { geometryOf } from "./index"

// The kind contract. Every method here is what a `path` kind will have to
// implement too, so these double as the specification for adding one.

const props = (startX, startY, endX, endY, extra = {}) => ({ startX, startY, endX, endY, ...extra })

describe("geometryOf", () => {
  it("maps the box-shaped types to the box kind", () => {
    for (const type of ["rectangle", "oval", "text"]) {
      expect(geometryOf({ type })).toBe(box)
    }
  })

  it("maps line to the segment kind", () => {
    expect(geometryOf({ type: "line" })).toBe(segment)
  })

  it("falls back to box for an unregistered type", () => {
    // A new element type should transform sensibly before anyone remembers to
    // register its kind.
    expect(geometryOf({ type: "sticky" })).toBe(box)
    expect(geometryOf({ type: undefined })).toBe(box)
  })
})

describe("the shared contract", () => {
  for (const [name, kind] of [["box", box], ["segment", segment]]) {
    describe(name, () => {
      it("implements every method", () => {
        for (const m of ["rotationOf", "bounds", "corners", "center", "translate", "mapIntoBox", "rotate"]) {
          expect(typeof kind[m]).toBe("function")
        }
        expect(typeof kind.storesRotation).toBe("boolean")
      })

      it("bounds normalises corner order", () => {
        expect(kind.bounds(props(100, 50, 0, 0)))
          .toEqual({ left: 0, top: 0, right: 100, bottom: 50 })
      })

      it("center averages the stored corners", () => {
        expect(kind.center(props(0, 0, 100, 50))).toEqual({ x: 50, y: 25 })
      })

      it("translate offsets both corners and returns a patch", () => {
        expect(kind.translate(props(0, 0, 100, 50), 10, -5))
          .toEqual({ startX: 10, startY: -5, endX: 110, endY: 45 })
      })

      it("translate does not mutate its input", () => {
        const p = props(0, 0, 100, 50)
        kind.translate(p, 10, 10)
        expect(p).toEqual(props(0, 0, 100, 50))
      })

      it("mapIntoBox scales proportionally into the new group box", () => {
        const oldBox = { left: 0, top: 0, right: 100, bottom: 100 }
        const newBox = { left: 0, top: 0, right: 200, bottom: 200 }
        expect(kind.mapIntoBox(props(0, 0, 50, 50), oldBox, newBox))
          .toEqual({ startX: 0, startY: 0, endX: 100, endY: 100 })
      })

      it("mapIntoBox preserves stored corner order", () => {
        // Mapping raw (not normalised) corners is what keeps a segment pointing
        // the same way through a group resize.
        const oldBox = { left: 0, top: 0, right: 100, bottom: 100 }
        const newBox = { left: 0, top: 0, right: 200, bottom: 200 }
        const out = kind.mapIntoBox(props(100, 100, 0, 0), oldBox, newBox)
        expect(out.startX).toBeGreaterThan(out.endX)
        expect(out.startY).toBeGreaterThan(out.endY)
      })
    })
  }
})

describe("box", () => {
  it("stores rotation as data", () => {
    expect(box.storesRotation).toBe(true)
    expect(box.rotationOf(props(0, 0, 10, 10, { rotation: 45 }))).toBe(45)
  })

  it("reports no rotation when absent or null", () => {
    expect(box.rotationOf(props(0, 0, 10, 10))).toBe(0)
    expect(box.rotationOf(props(0, 0, 10, 10, { rotation: null }))).toBe(0)
  })

  it("gives two corners unrotated and four once rotated", () => {
    expect(box.corners(props(0, 0, 100, 50))).toHaveLength(2)
    expect(box.corners(props(0, 0, 100, 50, { rotation: 30 }))).toHaveLength(4)
  })

  describe("rotate", () => {
    it("accumulates the turn into rotation, in whole degrees", () => {
      const out = box.rotate(props(0, 0, 100, 50, { rotation: 10 }), { x: 50, y: 25 }, 20.4)
      expect(out.rotation).toBe(30)
    })

    it("keeps the size intact when turning about its own centre", () => {
      const p = props(0, 0, 100, 50, { rotation: 0 })
      const out = box.rotate(p, { x: 50, y: 25 }, 90)
      expect(out.endX - out.startX).toBeCloseTo(100)
      expect(out.endY - out.startY).toBeCloseTo(50)
    })

    it("orbits its centre about a group pivot", () => {
      // Centre (50,25) turned 180° about the origin lands at (-50,-25).
      const out = box.rotate(props(0, 0, 100, 50), { x: 0, y: 0 }, 180)
      expect((out.startX + out.endX) / 2).toBeCloseTo(-50)
      expect((out.startY + out.endY) / 2).toBeCloseTo(-25)
    })

    it("does not wrap past a full turn", () => {
      const out = box.rotate(props(0, 0, 10, 10, { rotation: 350 }), { x: 5, y: 5 }, 20)
      expect(out.rotation).toBe(370)
    })
  })
})

describe("segment", () => {
  it("bakes rotation into its coordinates rather than storing it", () => {
    expect(segment.storesRotation).toBe(false)
    expect(segment.rotationOf(props(0, 0, 10, 10))).toBe(0)
  })

  it("reports zero rotation even if a stray one is stored", () => {
    // Its endpoints already encode its angle; honouring a rotation property
    // would turn it twice.
    expect(segment.rotationOf(props(0, 0, 10, 10, { rotation: 90 }))).toBe(0)
  })

  it("always has exactly its two endpoints as corners", () => {
    expect(segment.corners(props(0, 0, 100, 0))).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }])
    expect(segment.corners(props(0, 0, 100, 0, { rotation: 90 }))).toHaveLength(2)
  })

  describe("rotate", () => {
    it("moves the endpoints and writes no rotation property", () => {
      const out = segment.rotate(props(0, 0, 100, 0), { x: 0, y: 0 }, 90)
      expect(out.startX).toBeCloseTo(0)
      expect(out.startY).toBeCloseTo(0)
      expect(out.endX).toBeCloseTo(0)
      expect(out.endY).toBeCloseTo(100)
      expect("rotation" in out).toBe(false)
    })

    it("preserves direction and length", () => {
      const p = props(10, 10, 60, 10)
      const out = segment.rotate(p, { x: 0, y: 0 }, 37)
      const lengthBefore = Math.hypot(p.endX - p.startX, p.endY - p.startY)
      const lengthAfter = Math.hypot(out.endX - out.startX, out.endY - out.startY)
      expect(lengthAfter).toBeCloseTo(lengthBefore)
    })
  })
})
