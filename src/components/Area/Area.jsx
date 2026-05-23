import styles from "./Area.module.css"

export default function Area(props){
  const areaProps = {
    x: (props.startX < props.x) ? props.startX : props.x,
    y: (props.startY < props.y) ? props.startY : props.y,
    width: (props.startX < props.x) ? props.x - props.startX : props.startX - props.x,
    height: (props.startY < props.y) ? props.y - props.startY : props.startY - props.y,
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