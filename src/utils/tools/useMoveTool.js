import { useRef } from 'react';
import usePointer from '../hooks/usePointer';

// This hook is used to implement the "Move" tool. 
// It needs a condition to be active

export default function useMoveTool(ref, active, scrollTo) {
  const boardPos = useRef({
    x: 0, 
    y: 0
  })

  usePointer(ref, {
    active: active,
    cursor: "grab",
    onDown: (p, setCursor) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop
      }
      setCursor("grabbing")
    },
    onMove: (p) => {
      if(!p.hasDragged) return;
      
      const dx = p.x - p.startX;
      const dy = p.y - p.startY;
      scrollTo(boardPos.current.x - dx, boardPos.current.y - dy);
    },
    onUp: (p, setCursor) => {
      setCursor()
    }
  })
}