import { useState } from "react";

// State for the drag ghost: which mode is being previewed and its world-coord
// corners, or null when nothing is. Rendering lives in <Preview> — this hook
// deliberately stores plain data, never JSX.

export default function usePreview(){
  const [preview, setPreview] = useState(null)

  const enablePreview = (mode, startX, startY, endX, endY) => {
    setPreview({ mode, startX, startY, endX, endY })
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
