import { useEffect } from "react"
import styles from "./Line.module.css"

export default function Line(props){
  const coords = {
    x: props.startX,
    y: props.startY,
    length: Math.hypot(props.x - props.startX, props.y - props.startY),
    angle: Math.atan2(props.y - props.startY, props.x - props.startX)
  }

  return(
    <div className={styles.line} data-uuid={props.uuid} data-selected={props.selected} style={{
      "--x": coords.x + "px",
      "--y": coords.y + "px",
      "--length": coords.length + "px",
      "--angle": coords.angle + "rad"
    }}></div>
  )
}