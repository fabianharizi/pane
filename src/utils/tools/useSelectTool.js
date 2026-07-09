import { useRef } from 'react';
import usePointer from '../hooks/usePointer';

// This hook is used to implement the "Select" tool. 
// It needs a condition to be active

export default function useSelectTool(ref, active, selectElement) {
  const boardPos = useRef({
    x: 0, 
    y: 0
  })

  usePointer(ref, {
    active: active,
    cursor: "default",
    onClick: (mouse, setCursor) => {
      const uuid = mouse.target.hasAttribute("data-uuid") ? mouse.target.getAttribute("data-uuid") : null
      selectElement(uuid)
    }
  })
}