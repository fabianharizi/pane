import styles from "./ZoomBar.module.css"

// Zoom controls + readout, purely presentational: buttons dispatch registry
// commands (useCommands owns the zoom math). Clicking the readout resets.

export default function ZoomBar({ zoom, runCommand }){
  return (
    <div className={styles.zoombar}>
      <button onClick={() => runCommand("zoom-out")} title="Zoom out (Ctrl+-)">−</button>
      <button className={styles.readout} onClick={() => runCommand("zoom-reset")} title="Reset zoom (Ctrl+0)">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={() => runCommand("zoom-in")} title="Zoom in (Ctrl+=)">+</button>
    </div>
  )
}
