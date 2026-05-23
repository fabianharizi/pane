import { useEffect, useRef } from 'react';
import useMouse from './useMouse';

// This hook is used to implement the "Shape" tool. 
// It needs a condition to be active

export default function useShapeTool(boardRef, enableArea, disableArea, active) {
  const [mouse, onMouseDown, onMouseMove, onMouseUp, setCursor] = useMouse(boardRef);
  const startScroll = useRef({ x: 0, y: 0 });

  // Set cursor and attach listeners when tool is active
  useEffect(() => {
    if (!active) return;

    const board = boardRef.current;
    setCursor('crosshair');

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

  // Create area as mouse moves
  useEffect(() => {
    if (!active || !mouse.isDown) return;

    enableArea(mouse.startX, mouse.startY, mouse.x, mouse.y)

  }, [mouse.x, mouse.y]);

  // Hide area as mouse lifts
  useEffect(() => {
    if (!active || !mouse.isDown) disableArea();
    
  }, [mouse.isDown]);
}