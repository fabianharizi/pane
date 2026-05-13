import styles from "./Area.module.css"

export default function Area(props){
  return(
    <div className={styles.area} style={{
      "--x": props.x + "px",
      "--y": props.y + "px",
      "--width": props.width + "px",
      "--height": props.height + "px"
    }}></div>
  )
}