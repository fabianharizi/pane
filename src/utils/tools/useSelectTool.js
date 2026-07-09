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
    onClick: (p, setCursor) => {
      const uuid = p.target.hasAttribute("data-uuid") ? p.target.getAttribute("data-uuid") : null
      selectElement(uuid)
    }
  })
}