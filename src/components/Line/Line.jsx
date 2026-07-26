import styles from "./Line.module.css"
import { buildRoute, decorateRoute, routeBounds, pathD, trianglePathD } from "../../utils/methods/lineGeometry"

// Lines render as SVG — curves, elbows, and arrowheads need real paths. The
// component is dumb: it draws whatever endpoint props it's given (binding
// resolution happened upstream in encodeContent), so the Preview ghost can pass
// plain coords. The svg root is just a positioning frame at the route's bbox:
// it ignores pointer events and overflows freely — only the fat invisible hit
// path is clickable, so a diagonal line's box never swallows clicks on
// elements underneath it.

export default function Line({
  uuid, selected,
  properties
}){

  const p = {
    strokeColor: "#ffffff",
    strokeWidth: 2,
    strokeStyle: "solid",
    headStart: "none",
    headEnd: "arrow",
    routing: "straight",
    startSide: null, endSide: null,
    startDir: null, endDir: null,
    ...properties
  }

  const { route, arrows } = decorateRoute(buildRoute(p, p.routing), p)
  const b = routeBounds(route, arrows)

  const dash = p.strokeStyle === "dashed" ? `${p.strokeWidth * 3} ${p.strokeWidth * 2}`
             : p.strokeStyle === "dotted" ? `0.1 ${p.strokeWidth * 2}`
             : undefined

  return(
    <svg className={styles.line} data-uuid={uuid} data-selected={selected} style={{
      "--x": b.left + "px",
      "--y": b.top + "px",
      "--width": Math.max(1, b.right - b.left) + "px",
      "--height": Math.max(1, b.bottom - b.top) + "px",
    }}>
      <path
        className={styles.hit}
        d={pathD(route, b.left, b.top)}
        fill="none"
        stroke="transparent"
        strokeWidth={p.strokeWidth + 8}
      />
      <path
        d={pathD(route, b.left, b.top)}
        fill="none"
        stroke={p.strokeColor}
        strokeWidth={p.strokeWidth}
        strokeDasharray={dash}
        strokeLinecap={p.strokeStyle === "dotted" ? "round" : undefined}
        strokeLinejoin="round"
      />
      {arrows.map((tri, i) => (
        <path key={i} d={trianglePathD(tri, b.left, b.top)} fill={p.strokeColor} />
      ))}
    </svg>
  )
}
