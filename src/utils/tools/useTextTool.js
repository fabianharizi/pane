import { useRef } from 'react';
import useMouse from '../hooks/useMouse';

// This hook is used to implement the "Shape" tool. 
// It needs a condition to be active

export default function useTextTool(ref, active, enablePreview, disablePreview, addElement) {
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
    onDrag: (mouse) => {
      enablePreview(
        "rectangle", 
        mouse.startX + boardPos.current.x, 
        mouse.startY + boardPos.current.y, 
        mouse.x + boardPos.current.x, 
        mouse.y + boardPos.current.y
      )
    },
    onUp: (mouse) => {
      addElement(
        "text", 
        mouse.startX + boardPos.current.x - boardPos.current.centerX, 
        mouse.startY + boardPos.current.y - boardPos.current.centerY, 
        mouse.x + boardPos.current.x - boardPos.current.centerX, 
        mouse.y + boardPos.current.y - boardPos.current.centerY,
        {
          content: "Lorem ipsum dolor sit amet"
        }
      )
      disablePreview()
    }
  })
}