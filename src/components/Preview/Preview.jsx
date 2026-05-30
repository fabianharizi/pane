import styles from "./Preview.module.css"

export default function Preview(props){
  const areaProps = {
    x: Math.min(props.startX, props.x),
    y: Math.min(props.startY, props.y),
    width: Math.abs(props.x - props.startX),
    height: Math.abs(props.y - props.startY),
  }

  return(
    <div className={
      styles.area + " " +(
      (props.mode == "rectangle") ? styles.rectangle : 
      (props.mode == "oval") ? styles.oval : ""
    )} style={{
      "--x": areaProps.x + "px",
      "--y": areaProps.y + "px",
      "--width": areaProps.width + "px",
      "--height": areaProps.height + "px"
    }}></div>
  )
}