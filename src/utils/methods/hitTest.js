import { anchorPoint, rotatePoint } from "./lineGeometry"

// Bind-target hit-testing for line endpoints: which element (and which of its
// sides) should a dragged endpoint attach to. Only box-like elements are
// bindable — lines can't bind to lines or to themselves.

const BINDABLE = new Set(["rectangle", "oval", "text"])

// Padding around the target's box, in SCREEN px (divided by zoom at use), so a
// drop just outside the border still binds.
const BIND_PAD = 10

// Topmost bindable element under a world point. Returns the target's uuid, the
// nearest side (the one a dropped endpoint should anchor to), the anchor point
// itself, and the target's bounds/rotation (for rendering a highlight) — or
// null when the point is over empty canvas.
export function bindTargetAt(content, worldPt, zoom = 1) {
  const pad = BIND_PAD / zoom

  // Content order is z-order, so scan topmost-first.
  for (let i = content.length - 1; i >= 0; i--) {
    const el = content[i]
    if (!BINDABLE.has(el.type)) continue

    const { startX, startY, endX, endY, rotation = 0 } = el.properties
    const left = Math.min(startX, endX)
    const right = Math.max(startX, endX)
    const top = Math.min(startY, endY)
    const bottom = Math.max(startY, endY)
    const center = { x: (left + right) / 2, y: (top + bottom) / 2 }

    // Test in the element's local frame: un-rotate the point instead of
    // rotating the box.
    const p = rotation ? rotatePoint(worldPt, center, -rotation) : worldPt
    if (p.x < left - pad || p.x > right + pad || p.y < top - pad || p.y > bottom + pad) continue

    const distances = {
      left: Math.abs(p.x - left),
      right: Math.abs(p.x - right),
      top: Math.abs(p.y - top),
      bottom: Math.abs(p.y - bottom),
    }
    const side = Object.keys(distances).reduce((a, b) => (distances[a] <= distances[b] ? a : b))

    return {
      uuid: el.uuid,
      side,
      anchor: anchorPoint(el, side),
      bounds: { left, top, right, bottom, rotation },
    }
  }
  return null
}
