import { useEffect } from "react"
import styles from "./Line.module.css"

export default function Line({
  uuid, selected,
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
    x: p.startX,
    y: p.startY - (p.strokeWidth / 2) - 5,
    length: Math.hypot(p.endX - p.startX, p.endY - p.startY),
    angle: Math.atan2(p.endY - p.startY, p.endX - p.startX)
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