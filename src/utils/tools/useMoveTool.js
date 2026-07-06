import { useRef } from 'react';
import useMouse from '../hooks/useMouse';

// This hook is used to implement the "Move" tool. 
// It needs a condition to be active

export default function useMoveTool(ref, active, scrollTo) {
  const boardPos = useRef({
    x: 0, 
    y: 0
  })

  useMouse(ref, {
    active: active,
    cursor: "grab",
    onDown: (mouse, setCursor) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop
      }
      setCursor("grabbing")
    },
    onMove: (mouse) => {
      if(!mouse.hasDragged) return;
      
      const dx = mouse.x - mouse.startX;
      const dy = mouse.y - mouse.startY;
      scrollTo(boardPos.current.x - dx, boardPos.current.y - dy);
    },
    onUp: (mouse, setCursor) => {
      setCursor()
    }
  })
}