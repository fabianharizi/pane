import styles from "./ZoomBar.module.css"

// Zoom controls + readout. Clicking the readout resets to 100%.

export default function ZoomBar({ zoom, zoomTo }){
  return (
    <div className={styles.zoombar}>
      <button onClick={() => zoomTo(zoom / 1.25)} title="Zoom out (Ctrl+-)">−</button>
      <button className={styles.readout} onClick={() => zoomTo(1)} title="Reset zoom (Ctrl+0)">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={() => zoomTo(zoom * 1.25)} title="Zoom in (Ctrl+=)">+</button>
    </div>
  )
}
