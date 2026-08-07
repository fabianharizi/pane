import { describe, it, expect } from "vitest"
import { rawCorners, cornersOf, boundsOf } from "./index"

// Characterisation tests for element footprints and group bounds. The
// `rotated` flag on boundsOf is load-bearing and easy to get backwards, so it
// is pinned from both directions here.

const box = (startX, startY, endX, endY, rotation) => ({
  uuid: "b", type: "rectangle",
  properties: { startX, startY, endX, endY, ...(rotation === undefined ? {} : { rotation }) },
})

const line = (startX, startY, endX, endY) => ({
  uuid: "l", type: "line",
  properties: { startX, startY, endX, endY },
})

describe("rawCorners", () => {
  it("returns the two stored corners in stored order", () => {
    expect(rawCorners(box(0, 0, 100, 50))).toEqual([{ x: 0, y: 0 }, { x: 100, y: 50 }])
  })

  it("does not normalise, so a segment keeps its direction", () => {
    expect(rawCorners(line(100, 50, 0, 0))).toEqual([{ x: 100, y: 50 }, { x: 0, y: 0 }])
  })
})

describe("cornersOf", () => {
  it("returns two corners for an unrotated box", () => {
    expect(cornersOf(box(0, 0, 100, 50))).toHaveLength(2)
  })

  it("expands to all four corners once rotated", () => {
    expect(cornersOf(box(0, 0, 100, 50, 30))).toHaveLength(4)
  })

  it("rotates the footprint about the element centre", () => {
    // 100x50 rotated 90° about (50,25) becomes 50 wide by 100 tall.
    const corners = cornersOf(box(0, 0, 100, 50, 90))
    const xs = corners.map(p => p.x)
    const ys = corners.map(p => p.y)
    expect(Math.min(...xs)).toBeCloseTo(25)
    expect(Math.max(...xs)).toBeCloseTo(75)
    expect(Math.min(...ys)).toBeCloseTo(-25)
    expect(Math.max(...ys)).toBeCloseTo(75)
  })

  it("treats rotation of 0, undefined and null as unrotated", () => {
    expect(cornersOf(box(0, 0, 100, 50, 0))).toHaveLength(2)
    expect(cornersOf(box(0, 0, 100, 50))).toHaveLength(2)
    expect(cornersOf(box(0, 0, 100, 50, null))).toHaveLength(2)
  })

  it("ignores rotation on a line, whose endpoints ARE its direction", () => {
    // Even if a stray rotation is stored, a segment must not be re-rotated.
    const strayed = { ...line(0, 0, 100, 0) }
    strayed.properties.rotation = 90
    expect(cornersOf(strayed)).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }])
  })
})

describe("boundsOf", () => {
  it("covers a single unrotated element", () => {
    expect(boundsOf([box(0, 0, 100, 50)]))
      .toEqual({ left: 0, top: 0, right: 100, bottom: 50 })
  })

  it("normalises inverted corners", () => {
    expect(boundsOf([box(100, 50, 0, 0)]))
      .toEqual({ left: 0, top: 0, right: 100, bottom: 50 })
  })

  it("spans a group", () => {
    expect(boundsOf([box(0, 0, 10, 10), box(90, 40, 100, 50)]))
      .toEqual({ left: 0, top: 0, right: 100, bottom: 50 })
  })

  it("covers a rotated member's overhang when rotated=true", () => {
    // A 100x50 turned 90° is taller than its unrotated box, so the group box
    // must grow — otherwise a rotated member pokes outside the chrome.
    const rotated = boundsOf([box(0, 0, 100, 50, 90)], true)
    expect(rotated.top).toBeCloseTo(-25)
    expect(rotated.bottom).toBeCloseTo(75)
  })

  it("stays in the element's own unrotated frame when rotated=false", () => {
    // The lone-element case: the chrome itself carries the rotation, so
    // measuring the rotated footprint here would apply it twice.
    expect(boundsOf([box(0, 0, 100, 50, 90)], false))
      .toEqual({ left: 0, top: 0, right: 100, bottom: 50 })
  })

  it("defaults to the rotated footprint", () => {
    const el = box(0, 0, 100, 50, 90)
    expect(boundsOf([el])).toEqual(boundsOf([el], true))
  })

  it("bounds a mixed selection of boxes and lines", () => {
    expect(boundsOf([box(0, 0, 50, 50), line(200, -30, 100, 20)]))
      .toEqual({ left: 0, top: -30, right: 200, bottom: 50 })
  })

  it("returns a zero-area box for a single degenerate element", () => {
    expect(boundsOf([box(5, 5, 5, 5)]))
      .toEqual({ left: 5, top: 5, right: 5, bottom: 5 })
  })
})
