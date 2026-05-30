// This hook is used to implement the select preview ghost

import { useEffect, useState } from "react";

export default function usePreview(){
  const [preview, setPreview] = useState({
    isVisible: true,  
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    mode: "default"
  })

  const enablePreview = (startX, startY, x, y, mode) => {
    setPreview({
      isVisible: true,  
      startX: startX,
      startY: startY,
      x: x,
      y: y,
      mode: mode
    })
  }

  const disablePreview = () => {
    setPreview(prev => ({...prev, isVisible: false}));
  }

  return [preview, enablePreview, disablePreview];
}