import shared from "./shared"
import { centerOf, cornerPoints, rotatePoint } from "./primitives"

// A box: two opposite corners plus a stored `rotation` in degrees about its own
// centre. Rectangles, ovals and text. Corner order carries no meaning — every
// reader normalises — so a box may be drawn in any direction.

export default {
  ...shared,

  // Boxes are the only kind that keep rotation as data rather than baking it
  // into coordinates, which is why the selection chrome can rotate *with* a lone
  // box and why the Properties panel can show it a rotation field.
  storesRotation: true,

  rotationOf: (props) => props.rotation ?? 0,

  // A rotated box's visual footprint is its rotated rectangle, so all four
  // corners matter; unrotated, the two stored ones already bound it.
  corners: (props) => {
    const rotation = props.rotation ?? 0
    if (!rotation) return cornerPoints(props)

    const { startX, startY, endX, endY } = props
    const c = centerOf(props)
    return [
      { x: startX, y: startY }, { x: endX, y: startY },
      { x: endX, y: endY }, { x: startX, y: endY },
    ].map(p => rotatePoint(p, c, rotation))
  },

  // The centre orbits the pivot and the size is untouched; the turn itself
  // accumulates into `rotation`. Whole degrees — plenty for hand-rotation, and
  // it keeps the Properties panel readable. Deliberately not wrapped to 0–360.
  rotate: (props, pivot, degrees) => {
    const c = centerOf(props)
    const c2 = rotatePoint(c, pivot, degrees)
    const dx = c2.x - c.x
    const dy = c2.y - c.y
    return {
      startX: props.startX + dx, startY: props.startY + dy,
      endX: props.endX + dx, endY: props.endY + dy,
      rotation: Math.round((props.rotation ?? 0) + degrees),
    }
  },
}
