import { X } from "lucide-react"
import styles from "./Pane.module.css"

// A pane is a generated widget presented as an app window: a title bar with a
// close button above an iframe body. The wrapper (not the iframe) carries
// `data-uuid`, which matters for more than tidiness — the iframe swallows every
// pointer event that lands on it, so the title bar is the only part of a pane
// the board can actually see a click on. That makes it the selection grip by
// construction: useSelectTool's `closest('[data-uuid]')` resolves to the
// wrapper from a title bar click, and to nothing from a widget click.
//
// Properties
//    title: string
//    fill: css(color)
//    strokeColor: css(color)
//    strokeWidth: int
//    strokeStyle: solid | dashed | dotted
//    borderRadius: int
//    opacity: int
//
// `onClose` is optional: the button hides itself when no handler is wired, so
// the chrome never offers an action that does nothing.

export default function Pane({
  uuid, selected,
  properties,
  widgetHTML,
  onClose
}){

  const p = {
    title: "Untitled",
    // Window chrome rather than a plain box, so the defaults follow the app's
    // panel language (translucent dark, hairline border) instead of Shape's.
    fill: "#16161a",
    strokeColor: "#ffffff2b",
    strokeWidth: 1,
    strokeStyle: "solid",
    borderRadius: 8,
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
    <div className={styles.pane} data-uuid={uuid} data-selected={selected} style={{
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
    }}>
      <div className={styles.titlebar}>
        <span className={styles.title}>{p.title}</span>
        {onClose && <button
          className={styles.close}
          type="button"
          aria-label="Close pane"
          // The board owns pointerdown/click on everything beneath it; without
          // these the press also starts a marquee and the release reselects.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onClose() }}
        ><X size={13} strokeWidth={2} /></button>}
      </div>

      <iframe
        className={styles.widget}
        srcDoc={widgetHTML}
        sandbox="allow-scripts"
        title={p.title}
      />
    </div>
  )
}
