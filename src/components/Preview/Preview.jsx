import Shape from "../Shape/Shape";
import Line from "../Line/Line";
import BindPoint from "../BindPoint/BindPoint";

// The drag ghost. All preview render logic lives here, keyed by `mode`; the
// usePreview hook only holds the data. Coordinates are world coords — the
// ghost renders inside the world div, so the camera maps it like any element.
//
// Adding a future mode = one MODES entry: which component draws the ghost,
// any extra props it needs, and the ghost's style bag.

const GHOST = { strokeColor: "#0088aaaa", strokeWidth: 2, strokeStyle: "dashed" };

const MODES = {
  rectangle: { Component: Shape, props: { type: "rectangle" }, style: { ...GHOST, fill: "transparent" } },
  oval:      { Component: Shape, props: { type: "oval" },      style: { ...GHOST, fill: "transparent" } },
  line:      { Component: Line,  props: {},                    style: { ...GHOST, headStart: "none", headEnd: "arrow", routing: "straight" } },
  select:    { Component: Shape, props: { type: "rectangle" }, style: { ...GHOST, fill: "#0088aa20" } },  // marquee
};

export default function Preview({ mode, startX, startY, endX, endY, anchors }) {
  const spec = MODES[mode];
  if (!spec) return null;                      // unknown mode renders nothing

  const { Component, props, style } = spec;
  return (
    <>
      <Component {...props} properties={{ startX, startY, endX, endY, ...style }} />
      {/* Pending bind anchors, in world coords (this renders inside the world
          div). The ghost has already snapped to them, so these confirm exactly
          where each end will attach. */}
      {anchors?.map((a, i) => <BindPoint key={i} x={a.x} y={a.y} />)}
    </>
  );
}
