import Shape from "../Shape/Shape";
import Line from "../Line/Line";

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
  line:      { Component: Line,  props: {},                    style: { ...GHOST, headStart: "none", headEnd: "none" } },
  select:    { Component: Shape, props: { type: "rectangle" }, style: { ...GHOST, fill: "#0088aa20" } },  // marquee
};

export default function Preview({ mode, startX, startY, endX, endY }) {
  const spec = MODES[mode];
  if (!spec) return null;                      // unknown mode renders nothing

  const { Component, props, style } = spec;
  return <Component {...props} properties={{ startX, startY, endX, endY, ...style }} />;
}
