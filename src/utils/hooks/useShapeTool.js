import { useEffect, useRef } from 'react';
import useMouse from './useMouse';

// This hook is used to implement the "Shape" tool. 
// It needs a condition to be active

export default function useShapeTool(ref, active, shape, enableArea, disableArea, addElement) {
  const boardPos = useRef({
    x: 0, 
    y: 0
  })

  useMouse(ref, {
    active: active,
    onDown: (mouse) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop
      }
    },
    onDrag: (mouse) => {
      enableArea(mouse.startX, mouse.startY, mouse.x, mouse.y, shape)
    },
    onUp: (mouse) => {
      addElement(
        shape, 
        mouse.startX + boardPos.current.x, 
        mouse.startY + boardPos.current.y, 
        mouse.x + boardPos.current.x, 
        mouse.y + boardPos.current.y
      )
      disableArea()
    }
  })
}