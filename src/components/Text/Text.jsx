import styles from "./Text.module.css"

export default function Text(props){
  const shapeProps = {
    x: Math.min(props.startX, props.x),
    y: Math.min(props.startY, props.y),
    width: Math.abs(props.x - props.startX),
    height: Math.abs(props.y - props.startY),
  }

  return(
      <div contentEditable="true" className={styles.text} style={{
        "--x": shapeProps.x + "px",
        "--y": shapeProps.y + "px",
        "--width": (shapeProps.width > 10) ? shapeProps.width + "px" : "min-content",
        "--height":(shapeProps.height > 10) ?  shapeProps.height + "px" : "min-content"
      }}>{props.content}</div>
  )
}