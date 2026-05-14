import styles from "./Shape.module.css"

export default function Shape(props){
  return(
    <div className={
      styles.shape + " " +(
      (props.shape == "rectangle") ? styles.rectangle : 
      (props.shape == "oval") ? styles.oval : ""
    )} style={{
      "--x": props.x + "px",
      "--y": props.y + "px",
      "--width": props.width + "px",
      "--height": props.height + "px"
    }}></div>
  )
}