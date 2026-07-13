import { useRef } from 'react';
import usePointer from '../hooks/usePointer';

// This hook is used to implement the "Select" tool. 
// It needs a condition to be active

export default function useSelectTool(ref, active, content, selectElement, enablePreview, disablePreview) {
  const boardPos = useRef({
    x: 0, 
    y: 0,
    centerX: 0,
    centerY: 0,
  })

  usePointer(ref, {
    active: active,
    cursor: "default",
    onDown: (p, setCursor) => {
      boardPos.current = {
        x: ref.current.scrollLeft, 
        y: ref.current.scrollTop,
        centerX: ref.current.scrollWidth / 2,
        centerY: ref.current.scrollHeight / 2,
      }
    },
    onMove: (p) => {
      if(!p.hasDragged) return;
      enablePreview(
        "select", 
        p.startX + boardPos.current.x, 
        p.startY + boardPos.current.y, 
        p.x + boardPos.current.x, 
        p.y + boardPos.current.y
      )
    },
    onUp: (p) => {
      disablePreview()

      // A plain click is single-select (handled in onClick); only a drag marquees.
      if (!p.hasDragged) return;

      // Selection rect in CENTER-RELATIVE coords (the space elements are stored in).
      // ex - sx == p.x - p.startX: the scroll/center offsets cancel between endpoints.
      const sx = p.startX + boardPos.current.x - boardPos.current.centerX;
      const sy = p.startY + boardPos.current.y - boardPos.current.centerY;
      const ex = p.x + boardPos.current.x - boardPos.current.centerX;
      const ey = p.y + boardPos.current.y - boardPos.current.centerY;

      const coords = {
        x: Math.min(sx, ex),
        y: Math.min(sy, ey),
        width: Math.abs(ex - sx),
        height: Math.abs(ey - sy),
      }

      // Every uuid whose bounding box overlaps the selection rect (partial or full).
      const selectedElements = content
        .filter(el => {
          const { startX, startY, endX, endY } = el.properties;
          const left = Math.min(startX, endX);
          const top = Math.min(startY, endY);
          const right = Math.max(startX, endX);
          const bottom = Math.max(startY, endY);

          // AABB overlap: the two boxes intersect on both axes.
          return left < coords.x + coords.width
            && right > coords.x
            && top < coords.y + coords.height
            && bottom > coords.y;
        })
        .map(el => el.uuid);

      console.log(selectedElements); // TODO: apply multi-selection once the model supports it
    },
    onClick: (p, setCursor) => {
      const el = p.target?.closest('[data-uuid]');
      selectElement(el ? el.getAttribute('data-uuid') : null);
      disablePreview()
    }
  })
}