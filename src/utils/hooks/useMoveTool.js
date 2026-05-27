import { useRef } from 'react';
import useMouse from './useMouse';

// This hook is used to implement the "Move" tool. 
// It needs a condition to be active

export default function useMoveTool(ref, active, scrollTo) {
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
      const dx = mouse.x - mouse.startX;
      const dy = mouse.y - mouse.startY;
      scrollTo(boardPos.current.x - dx, boardPos.current.y - dy);
    },
    // onUp: (mouse) => { }
  })
}