import styles from "./Line.module.css"

export default function Line(props){
  const shapeProps = {
    x: Math.min(props.startX, props.x),
    y: Math.min(props.startY, props.y),
    width: Math.abs(props.x - props.startX),
    height: Math.abs(props.y - props.startY),
  }
  return(
    <div className={
      styles.shape + " " +(
      (props.type == "rectangle") ? styles.rectangle : 
      (props.type == "oval") ? styles.oval : ""
    )} style={{
      "--x": shapeProps.x + "px",
      "--y": shapeProps.y + "px",
      "--width": shapeProps.width + "px",
      "--height": shapeProps.height + "px"
    }}></div>
  )
}