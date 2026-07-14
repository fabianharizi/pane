import styles from "./Shape.module.css"

// Properties
//    fill: css(color)
//    strokeColor: css(color)
//    strokeWidth: int
//    strokeStyle: solid | dashed | dotted
//    borderRadius: int
//    opacity: int

export default function Shape({
  type,
  uuid, selected,
  properties
}){
  
  const p = {
    fill: "#ffffff",
    strokeColor: "#ffffff",
    strokeWidth: 2,
    strokeStyle: "solid",
    borderRadius: 0,
    opacity: 1,
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
    <div className={
      styles.shape + " " +(
      (type == "rectangle") ? styles.rectangle : 
      (type == "oval") ? styles.oval : 
      (type == "selected") ? styles.selected : ""
    )} data-uuid={uuid} data-selected={selected} style={{
      "--x": coords.x + "px",
      "--y": coords.y + "px",
      "--width": coords.width + "px",
      "--height": coords.height + "px",
      "--fill": p.fill,
      "--strokeColor": p.strokeColor,
      "--strokeWidth": p.strokeWidth + "px",
      "--strokeStyle": p.strokeStyle,
      "--borderRadius": p.borderRadius + "px",
      "--opacity": p.opacity,
      "--rotation": p.rotation + "deg"
    }}></div>
  )
}