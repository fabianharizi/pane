import { useEffect, useRef } from 'react';
import useMouse from './useMouse';

export default function useMoveTool(boardRef, scrollTo, active) {
  const [mouse, onMouseDown, onMouseMove, onMouseUp, setCursor] = useMouse(boardRef);
  const startScroll = useRef({ x: 0, y: 0 });

  // Set cursor and attach listeners when tool is active
  useEffect(() => {
    if (!active) return;

    const board = boardRef.current;
    setCursor('grab');

    const handleMouseDown = (e) => {
      startScroll.current = { x: board.scrollLeft, y: board.scrollTop };
      onMouseDown(e);
    };

    board.addEventListener('mousedown', handleMouseDown);
    board.addEventListener('mousemove', onMouseMove);
    board.addEventListener('mouseup', onMouseUp);

    return () => {
      setCursor('default');
      board.removeEventListener('mousedown', handleMouseDown);
      board.removeEventListener('mousemove', onMouseMove);
      board.removeEventListener('mouseup', onMouseUp);
    };
  }, [active]);

  // Switch cursor between grab and grabbing
  useEffect(() => {
    if (!active) return;
    setCursor(mouse.isDown ? 'grabbing' : 'grab');
  }, [mouse.isDown]);

  // Scroll the board as mouse moves
  useEffect(() => {
    if (!active || !mouse.isDown) return;
    const dx = mouse.x - mouse.startX;
    const dy = mouse.y - mouse.startY;
    scrollTo(startScroll.current.x - dx, startScroll.current.y - dy);
  }, [mouse.x, mouse.y]);
}