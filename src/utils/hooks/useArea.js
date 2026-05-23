// This hook is used to implement the select area highlight

import { useEffect, useState } from "react";

export default function useArea(){
  const [area, setArea] = useState({
    isVisible: true,  
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    mode: "default"
  })

  const enableArea = (startX, startY, x, y, mode) => {
    setArea({
      isVisible: true,  
      startX: startX,
      startY: startY,
      x: x,
      y: y,
      mode: mode
    })
  }

  const disableArea = () => {
    setArea(prev => ({...prev, isVisible: false}));
  }

  return [area, enableArea, disableArea];
}