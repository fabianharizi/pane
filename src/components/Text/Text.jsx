import { useEffect, useRef } from "react"
import styles from "./Text.module.css"

// `editing` is the in-place edit session for THIS element, or null:
//   { onChange(value), onEnd() }
// It's handed down from Board (which owns the uuid match) so the component
// stays dumb — it renders a textarea instead of static text and reports
// changes; it never decides when editing starts or stops.
//
// Alignment: `horizontal` (left/center/right) feeds `text-align` directly;
// `vertical` (top/middle/bottom) is a grid `align-content`, so the stored words
// map to CSS keywords here rather than storing CSS in the data.

const VERTICAL = { top: "start", middle: "center", bottom: "end" }

export default function Text({
  uuid, selected,
  properties,
  editing
}){

  const p = {
    content: "Lorem ipsum dolor sit amet",
    rotation: 0,
    horizontal: "left",
    vertical: "top",
    ...properties
  }

  const coords = {
    x: Math.min(p.startX, p.endX),
    y: Math.min(p.startY, p.endY),
    width: Math.abs(p.endX - p.startX),
    height: Math.abs(p.endY - p.startY),
  }

  const editor = useRef(null)

  // Take focus when the session OPENS, selecting the existing text so typing
  // replaces it (double-click-to-edit convention).
  //
  // The dep is a boolean, deliberately NOT `editing`: Board rebuilds that
  // descriptor object on every render, so keying off it re-runs this after
  // every keystroke — re-selecting the text so the next character wipes it,
  // leaving a field that never holds more than one letter.
  const isEditing = !!editing
  useEffect(() => {
    if (!isEditing) return
    editor.current?.focus()
    editor.current?.select()
  }, [isEditing])

  return(
      <div className={editing ? `${styles.text} ${styles.editing}` : styles.text}
        data-uuid={uuid} data-selected={selected} style={{
        "--x": coords.x + "px",
        "--y": coords.y + "px",
        "--width": (coords.width > 10) ? coords.width + "px" : "min-content",
        "--height":(coords.height > 10) ?  coords.height + "px" : "min-content",
        "--rotation": p.rotation + "deg",
        "--horizontal": p.horizontal,
        "--vertical": VERTICAL[p.vertical] ?? "start",
      }}>{editing
        ? <textarea
            ref={editor}
            className={styles.editor}
            value={p.content}
            onChange={(e) => editing.onChange(e.target.value)}
            onBlur={() => editing.onEnd()}
            // Escape ends the session; Enter stays a newline. Typing is already
            // safe from tool shortcuts — useShortcuts ignores textarea targets.
            onKeyDown={(e) => { if (e.key === "Escape") editing.onEnd() }}
            // Keep caret placement and text selection out of the board's hands:
            // otherwise a drag inside the textarea marquees, and a click
            // deselects the element (which would close the session).
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        : p.content}</div>
  )
}
