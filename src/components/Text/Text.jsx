import styles from "./Text.module.css"

export default function Text(props){
  const coords = {
    x: Math.min(props.startX, props.x),
    y: Math.min(props.startY, props.y),
    width: Math.abs(props.x - props.startX),
    height: Math.abs(props.y - props.startY),
  }

  return(
      <div className={styles.text} data-uuid={props.uuid} data-selected={props.selected} style={{
        "--x": coords.x + "px",
        "--y": coords.y + "px",
        "--width": (coords.width > 10) ? coords.width + "px" : "min-content",
        "--height":(coords.height > 10) ?  coords.height + "px" : "min-content"
      }}>{props.content}</div>
  )
}