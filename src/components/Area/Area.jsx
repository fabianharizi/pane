import styles from "./Area.module.css"

export default function Area(props){
  return(
    <div className={
      styles.area + " " +(
      (props.mode == "rectangle") ? styles.rectangle : 
      (props.mode == "oval") ? styles.oval : ""
    )} style={{
      "--x": props.x + "px",
      "--y": props.y + "px",
      "--width": props.width + "px",
      "--height": props.height + "px"
    }}></div>
  )
}