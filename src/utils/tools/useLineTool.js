import { useRef } from 'react';
import useMouse from '../hooks/useMouse';
import UUID from '../methods/UUID'

// This hook is used to implement the "Line" tool. 
// It needs a condition to be active

export default function useLineTool(ref, active, enablePreview, disablePreview, addElement) {
  const boardPos = useRef({
    x: 0, 
    y: 0,
    centerX: 0,
    centerY: 0,
  })

  useMouse(ref, {
    active: active,
    cursor: "crosshair",
    onDown: (mouse) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop,
        centerX: ref.current.scrollWidth / 2,
        centerY: ref.current.scrollHeight / 2,
      }
    },
    onMove: (mouse) => {
      if(!mouse.hasDragged) return;
      
      enablePreview(
        "line", 
        mouse.startX + boardPos.current.x, 
        mouse.startY + boardPos.current.y, 
        mouse.x + boardPos.current.x, 
        mouse.y + boardPos.current.y
      )
    },
    onUp: (mouse) => {
      addElement(
        "line", 
        UUID.generate("line"),
        mouse.startX + boardPos.current.x - boardPos.current.centerX, 
        mouse.startY + boardPos.current.y - boardPos.current.centerY, 
        (mouse.hasDragged) ? mouse.x + boardPos.current.x - boardPos.current.centerX 
                           : mouse.startX + boardPos.current.x - boardPos.current.centerX + 100, 
        (mouse.hasDragged) ? mouse.y + boardPos.current.y - boardPos.current.centerY 
                           : mouse.startY + boardPos.current.y - boardPos.current.centerY,
        {
          strokeColor: "#ffffff",
          strokeWidth: 2,
          strokeStyle: "solid",
          headStart: "none",
          headEnd: "arrow"
        }
      )
      disablePreview()
    }
  })
}