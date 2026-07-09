import { useRef } from 'react';
import usePointer from '../hooks/usePointer';
import UUID from '../methods/UUID'

// This hook is used to implement the "Shape" tool. 
// It needs a condition to be active

export default function useTextTool(ref, active, enablePreview, disablePreview, addElement, setActiveTool) {
  const boardPos = useRef({
    x: 0, 
    y: 0,
    centerX: 0,
    centerY: 0,
  })

  usePointer(ref, {
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
        "rectangle", 
        mouse.startX + boardPos.current.x, 
        mouse.startY + boardPos.current.y, 
        mouse.x + boardPos.current.x, 
        mouse.y + boardPos.current.y
      )
    },
    onUp: (mouse) => {
      const coords = {
        startX: mouse.startX + boardPos.current.x - boardPos.current.centerX, 
        startY: mouse.startY + boardPos.current.y - boardPos.current.centerY, 
        endX: (mouse.hasDragged) 
                ? mouse.x + boardPos.current.x - boardPos.current.centerX 
                : mouse.startX + boardPos.current.x - boardPos.current.centerX + 200, 
        endY: (mouse.hasDragged) 
                ? mouse.y + boardPos.current.y - boardPos.current.centerY 
                : mouse.startY + boardPos.current.y - boardPos.current.centerY + 50, 
      }

      addElement(
        "text", 
        UUID.generate("text"),
        {
          ...coords,
          content: "Lorem ipsum dolor sit amet"
        }
      )
      disablePreview()
      setActiveTool("select")
    }
  })
}