import usePointer from '../hooks/usePointer';

// This hook is used to implement the "Select" tool. 
// It needs a condition to be active

export default function useSelectTool(ref, active, selectElement) {
  usePointer(ref, {
    active: active,
    cursor: "default",
    onDown: (p, setCursor) => {},
    onClick: (p, setCursor) => {
      const el = p.target?.closest('[data-uuid]');
      selectElement(el ? el.getAttribute('data-uuid') : null);
    }
  })
}