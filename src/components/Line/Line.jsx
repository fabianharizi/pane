import { useEffect } from "react"
import styles from "./Line.module.css"

export default function Line({
  uuid, selected,
  startX, startY, x, y,
  properties
}){

  const p = {
    strokeColor: "#ffffff",
    strokeWidth: 2,
    strokeStyle: "solid",
    headStart: "none",
    headEnd: "none",
    ...properties
  }
  
  const coords = {
    x: startX,
    y: startY - (p.strokeWidth / 2) - 5,
    length: Math.hypot(x - startX, y - startY),
    angle: Math.atan2(y - startY, x - startX)
  }

  return(
    <div className={styles.line} data-uuid={uuid} data-selected={selected} style={{
      "--x": coords.x + "px",
      "--y": coords.y + "px",
      "--length": coords.length + "px",
      "--angle": coords.angle + "rad",
      "--strokeColor": p.strokeColor,
      "--strokeWidth": p.strokeWidth + "px",
      "--strokeStyle": p.strokeStyle,
    }}></div>
  )
}