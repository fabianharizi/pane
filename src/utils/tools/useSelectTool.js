import { useRef } from 'react';
import useMouse from '../hooks/useMouse';

// This hook is used to implement the "Select" tool. 
// It needs a condition to be active

export default function useSelectTool(ref, active, scrollTo) {
  const boardPos = useRef({
    x: 0, 
    y: 0
  })

  useMouse(ref, {
    active: active,
    cursor: "default",
    onClick: (mouse, setCursor) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop
      }
      setCursor("grabbing")
    }
  })
}