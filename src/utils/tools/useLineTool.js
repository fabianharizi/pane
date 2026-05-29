import { useRef } from 'react';
import useMouse from '../hooks/useMouse';

// This hook is used to implement the "Line" tool. 
// It needs a condition to be active

export default function useLineTool(ref, active, enableArea, disableArea, addElement) {
  const boardPos = useRef({
    x: 0, 
    y: 0
  })

  useMouse(ref, {
    active: active,
    cursor: "crosshair",
    onDown: (mouse) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop
      }
    },
    onDrag: (mouse) => {
      enableArea(mouse.startX, mouse.startY, mouse.x, mouse.y, "line")
    },
    onUp: (mouse) => {
      addElement(
        "line", 
        mouse.startX + boardPos.current.x, 
        mouse.startY + boardPos.current.y, 
        mouse.x + boardPos.current.x, 
        mouse.y + boardPos.current.y
      )
      disableArea()
    }
  })
}