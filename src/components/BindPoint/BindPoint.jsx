import styles from "./BindPoint.module.css"

// Marks the exact anchor a line endpoint will bind to — the target side's
// midpoint, not an outline around the whole element.
//
// Shared by BOTH binding gestures so "where will this attach" looks identical
// either way: dragging an existing endpoint (rendered by SelectionBox) and
// drawing a new line (rendered by Preview).
//
// `x`/`y` are offsets within the caller's positioned box: world coords when
// rendered straight into the world div, box-relative inside the SelectionBox.
export default function BindPoint({ x, y }) {
  return <span className={styles.bindPoint} style={{ "--hx": x + "px", "--hy": y + "px" }} />
}
