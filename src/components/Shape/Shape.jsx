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
  startX, startY, x, y,
  properties
}){
  
  const p = {
    fill: "#ffffff88",
    strokeColor: "#ffffff",
    strokeWidth: 2,
    strokeStyle: "solid",
    borderRadius: 0,
    opacity: 1,
    ...properties
  }

  const coords = {
    x: Math.min(startX, x),
    y: Math.min(startY, y),
    width: Math.abs(x - startX),
    height: Math.abs(y - startY),
  }
  return(
    <div className={
      styles.shape + " " +(
      (type == "rectangle") ? styles.rectangle : 
      (type == "oval") ? styles.oval : ""
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
      "--opacity": p.opacity
    }}></div>
  )
}