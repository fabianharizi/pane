import { useState } from "react";

// State for the drag ghost: which mode is being previewed and its world-coord
// corners, or null when nothing is. Rendering lives in <Preview> — this hook
// deliberately stores plain data, never JSX.

export default function usePreview(){
  const [preview, setPreview] = useState(null)

  // `extra` carries mode-specific hints beyond the ghost's corners — today the
  // line tool's pending bind anchors. Merged flat, so <Preview> just receives
  // them as ordinary props.
  const enablePreview = (mode, startX, startY, endX, endY, extra) => {
    setPreview({ mode, startX, startY, endX, endY, ...extra })
  }

  const disablePreview = () => {
    setPreview(null);
  }

  return {
    "preview": preview,
    "enablePreview": enablePreview,
    "disablePreview": disablePreview
  };
}
