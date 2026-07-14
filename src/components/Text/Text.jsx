import styles from "./Text.module.css"

export default function Text({
  uuid, selected,
  properties
}){

  const p = {
    content: "Lorem ipsum dolor sit amet",
    rotation: 0,
    ...properties
  }

  const coords = {
    x: Math.min(p.startX, p.endX),
    y: Math.min(p.startY, p.endY),
    width: Math.abs(p.endX - p.startX),
    height: Math.abs(p.endY - p.startY),
  }

  return(
      <div className={styles.text} data-uuid={uuid} data-selected={selected} style={{
        "--x": coords.x + "px",
        "--y": coords.y + "px",
        "--width": (coords.width > 10) ? coords.width + "px" : "min-content",
        "--height":(coords.height > 10) ?  coords.height + "px" : "min-content",
        "--rotation": p.rotation + "deg"
      }}>{p.content}</div>
  )
}