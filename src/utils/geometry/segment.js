import shared from "./shared"
import { rotatePoint } from "./primitives"

// A segment: two endpoints where the ORDER is meaningful — it's the direction,
// which drives arrowheads and routing. Lines. Unlike a box, corners are never
// normalised, and there is no stored rotation: rotating a segment just moves its
// endpoints, so the turn bakes into the coordinates.

export default {
  ...shared,

  storesRotation: false,

  // Always zero. A segment can carry no rotation property, so a stray one on an
  // element must not be honoured — its endpoints already encode its angle, and
  // applying a rotation on top would turn it twice.
  rotationOf: () => 0,

  // `corners` comes from shared: the two stored endpoints, unrotated.

  rotate: (props, pivot, degrees) => {
    const s = rotatePoint({ x: props.startX, y: props.startY }, pivot, degrees)
    const e = rotatePoint({ x: props.endX, y: props.endY }, pivot, degrees)
    return { startX: s.x, startY: s.y, endX: e.x, endY: e.y }
  },
}
