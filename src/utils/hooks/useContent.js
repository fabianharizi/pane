import { useState } from "react";

// This hook is used to keep track of the contents of the canvas

export default function useContent(start){
  const [content, setContent] = useState(start)

  const addElement = (type, startX, startY, x, y) => {
    setContent(prev => ([...prev, {
      type: type,
      startX: startX,
      startY: startY,
      x: x,
      y: y
    }]))
  }

  const clearContent = () => {
    setContent([])
  }

  return [content, addElement, clearContent];
}