import { describe, it, expect } from "vitest"
import { HANDLES, MIN_SIZE, handleOffset, snap15, resizeBox } from "./resize"

// Characterisation tests for the selection-chrome math. `resizeBox` carries the
// Shift aspect-lock and the anti-flip clamp — the two behaviours most likely to
// break silently in the geometry refactor, and both previously untested.

const box = () => ({ left: 0, top: 0, right: 100, bottom: 50 })
const edgesFor = (pos) => HANDLES.find(h => h.pos === pos).edges

describe("HANDLES", () => {
  it("has the eight compass positions", () => {
    expect(HANDLES.map(h => h.pos)).toEqual(["nw", "n", "ne", "e", "se", "s", "sw", "w"])
  })

  it("gives corners two edges and sides one", () => {
    for (const h of HANDLES) {
      const isCorner = h.pos.length === 2
      expect(h.edges).toHaveLength(isCorner ? 2 : 1)
    }
  })

  it("names only real edges", () => {
    const valid = new Set(["left", "right", "top", "bottom"])
    for (const h of HANDLES) {
      for (const e of h.edges) expect(valid.has(e)).toBe(true)
    }
  })
})

describe("handleOffset", () => {
  it("places each handle by its compass name", () => {
    expect(handleOffset("nw")).toEqual({ x: 0, y: 0 })
    expect(handleOffset("n")).toEqual({ x: 50, y: 0 })
    expect(handleOffset("ne")).toEqual({ x: 100, y: 0 })
    expect(handleOffset("e")).toEqual({ x: 100, y: 50 })
    expect(handleOffset("se")).toEqual({ x: 100, y: 100 })
    expect(handleOffset("s")).toEqual({ x: 50, y: 100 })
    expect(handleOffset("sw")).toEqual({ x: 0, y: 100 })
    expect(handleOffset("w")).toEqual({ x: 0, y: 50 })
  })
})

describe("snap15", () => {
  it("rounds to the nearest 15°", () => {
    expect(snap15(0)).toBe(0)
    expect(snap15(7)).toBe(0)
    expect(snap15(8)).toBe(15)
    expect(snap15(22)).toBe(15)
    expect(snap15(23)).toBe(30)
    expect(snap15(-8)).toBe(-15)
  })

  it("does not wrap past a full turn", () => {
    // SelectionBox accumulates rotation without normalising; snapping must not
    // quietly introduce wrapping.
    expect(snap15(370)).toBe(375)
    expect(snap15(-370)).toBe(-375)
  })
})

describe("resizeBox", () => {
  describe("moving edges", () => {
    it("moves only the edges the handle declares", () => {
      expect(resizeBox(box(), edgesFor("e"), 20, 999, false, MIN_SIZE))
        .toEqual({ left: 0, top: 0, right: 120, bottom: 50 })

      expect(resizeBox(box(), edgesFor("s"), 999, 20, false, MIN_SIZE))
        .toEqual({ left: 0, top: 0, right: 100, bottom: 70 })
    })

    it("moves both edges of a corner", () => {
      expect(resizeBox(box(), edgesFor("se"), 20, 10, false, MIN_SIZE))
        .toEqual({ left: 0, top: 0, right: 120, bottom: 60 })

      expect(resizeBox(box(), edgesFor("nw"), 10, 5, false, MIN_SIZE))
        .toEqual({ left: 10, top: 5, right: 100, bottom: 50 })
    })

    it("leaves the box untouched for a zero drag", () => {
      for (const h of HANDLES) {
        expect(resizeBox(box(), h.edges, 0, 0, false, MIN_SIZE)).toEqual(box())
      }
    })

    it("does not mutate the origin box", () => {
      const origin = box()
      resizeBox(origin, edgesFor("se"), 30, 30, false, MIN_SIZE)
      expect(origin).toEqual({ left: 0, top: 0, right: 100, bottom: 50 })
    })
  })

  describe("the anti-flip clamp", () => {
    it("stops a dragged edge crossing its anchor", () => {
      // Drag the right edge 500px left — far past the left edge.
      const out = resizeBox(box(), edgesFor("e"), -500, 0, false, MIN_SIZE)
      expect(out.right).toBe(MIN_SIZE)          // left + minSize
      expect(out.right).toBeGreaterThan(out.left)
    })

    it("clamps a dragged left edge the same way", () => {
      const out = resizeBox(box(), edgesFor("w"), 500, 0, false, MIN_SIZE)
      expect(out.left).toBe(100 - MIN_SIZE)     // right - minSize
      expect(out.left).toBeLessThan(out.right)
    })

    it("clamps both axes of a corner independently", () => {
      const out = resizeBox(box(), edgesFor("se"), -500, -500, false, MIN_SIZE)
      expect(out.right).toBe(MIN_SIZE)
      expect(out.bottom).toBe(MIN_SIZE)
    })

    it("honours a caller-supplied minimum (the zoom-scaled one)", () => {
      // SelectionBox passes MIN_SIZE / zoom so the floor is constant on screen.
      const out = resizeBox(box(), edgesFor("e"), -500, 0, false, 40)
      expect(out.right).toBe(40)
    })
  })

  describe("Shift aspect-lock", () => {
    it("preserves the original ratio from a corner", () => {
      // 100x50 is 2:1. Drag SE by +100 in x only; height must follow.
      const out = resizeBox(box(), edgesFor("se"), 100, 0, true, MIN_SIZE)
      const w = out.right - out.left
      const h = out.bottom - out.top
      expect(w / h).toBeCloseTo(2)
    })

    it("grows from the anchored corner, not the centre", () => {
      const out = resizeBox(box(), edgesFor("se"), 100, 0, true, MIN_SIZE)
      expect(out.left).toBe(0)
      expect(out.top).toBe(0)
    })

    it("moves the correct edges when dragging NW", () => {
      const out = resizeBox(box(), edgesFor("nw"), -100, 0, true, MIN_SIZE)
      // Bottom-right stays anchored.
      expect(out.right).toBe(100)
      expect(out.bottom).toBe(50)
      expect((out.right - out.left) / (out.bottom - out.top)).toBeCloseTo(2)
    })

    it("is ignored on side handles — only corners lock", () => {
      const locked = resizeBox(box(), edgesFor("e"), 100, 0, true, MIN_SIZE)
      const free = resizeBox(box(), edgesFor("e"), 100, 0, false, MIN_SIZE)
      expect(locked).toEqual(free)
    })

    it("is a no-op on a degenerate box, since there is no ratio", () => {
      const flat = { left: 0, top: 10, right: 100, bottom: 10 }
      const locked = resizeBox(flat, edgesFor("se"), 50, 50, true, 0)
      const free = resizeBox(flat, edgesFor("se"), 50, 50, false, 0)
      expect(locked).toEqual(free)
    })

    it("follows whichever axis was dragged further", () => {
      // Dominant y drag: width should be derived from height.
      const out = resizeBox(box(), edgesFor("se"), 0, 100, true, MIN_SIZE)
      expect((out.right - out.left) / (out.bottom - out.top)).toBeCloseTo(2)
      expect(out.bottom - out.top).toBeGreaterThan(50)
    })
  })
})
