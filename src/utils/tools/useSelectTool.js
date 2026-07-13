import { useRef } from 'react';
import usePointer from '../hooks/usePointer';

// This hook is used to implement the "Select" tool.
// Click selects one element (empty canvas deselects); dragging draws a marquee
// and selects every element it overlaps. Both paths go through selectElements.

export default function useSelectTool(ref, active, content, selectElements, enablePreview, disablePreview) {
  const boardPos = useRef({
    x: 0,
    y: 0,
    centerX: 0,
    centerY: 0,
  })

  usePointer(ref, {
    active: active,
    cursor: "default",
    onDown: () => {
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

      // A plain click is handled in onClick; only a drag marquees.
      if (!p.hasDragged) return;

      // Marquee rect in CENTER-RELATIVE coords (the space elements are stored in).
      const sx = p.startX + boardPos.current.x - boardPos.current.centerX;
      const sy = p.startY + boardPos.current.y - boardPos.current.centerY;
      const ex = p.x + boardPos.current.x - boardPos.current.centerX;
      const ey = p.y + boardPos.current.y - boardPos.current.centerY;

      const marquee = {
        left: Math.min(sx, ex),
        top: Math.min(sy, ey),
        right: Math.max(sx, ex),
        bottom: Math.max(sy, ey),
      }

      // Select every element whose bounding box overlaps the marquee (partial
      // or full); an empty result deselects all. The SelectionBox renders the
      // group box from the selection itself.
      selectElements(content
        .filter(el => {
          const { startX, startY, endX, endY } = el.properties;
          const left = Math.min(startX, endX);
          const top = Math.min(startY, endY);
          const right = Math.max(startX, endX);
          const bottom = Math.max(startY, endY);

          // AABB overlap: the two boxes intersect on both axes.
          return left < marquee.right
            && right > marquee.left
            && top < marquee.bottom
            && bottom > marquee.top;
        })
        .map(el => el.uuid))
    },
    onClick: (p) => {
      const el = p.target?.closest('[data-uuid]');
      selectElements(el ? [el.getAttribute('data-uuid')] : []);
      disablePreview()
    }
  })
}
