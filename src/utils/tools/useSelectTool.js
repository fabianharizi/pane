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

      // Elements whose bounding box overlaps the selection rect (partial or full).
      const selected = content.filter(el => {
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
      });

      const selectedElements = selected.map(el => el.uuid);

      if (selectedElements.length >= 2) {
        // Group bounding box: outermost corners across all selected elements
        // (center-relative). Fold both corners of each element into the running min/max.
        const bounds = selected.reduce((b, el) => {
          const { startX, startY, endX, endY } = el.properties;
          return {
            left: Math.min(b.left, startX, endX),
            top: Math.min(b.top, startY, endY),
            right: Math.max(b.right, startX, endX),
            bottom: Math.max(b.bottom, startY, endY),
          };
        }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });

        // Preview is fed ABSOLUTE canvas coords → add the center back (like onMove).
        enablePreview(
          "selected",
          bounds.left + boardPos.current.centerX,
          bounds.top + boardPos.current.centerY,
          bounds.right + boardPos.current.centerX,
          bounds.bottom + boardPos.current.centerY,
        );
      } else if (selectedElements.length == 1){
        selectElement(selectedElements[0])
      }
    },
    onClick: (p, setCursor) => {
      const el = p.target?.closest('[data-uuid]');
      selectElement(el ? el.getAttribute('data-uuid') : null);
      disablePreview()
    }
  })
}