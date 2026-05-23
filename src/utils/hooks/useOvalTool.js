import { useEffect, useRef } from 'react';
import useMouse from './useMouse';

// This hook is used to implement the "Oval" tool. 
// It needs a condition to be active

export default function useOvalTool(boardRef, enableArea, disableArea, addElement, active) {
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

  // Create area as mouse moves and create shape when mouse is up
  useEffect(() => {
    const board = boardRef.current;

    if (!active || !mouse.isDown) {
      addElement(
        "oval", 
        mouse.startX + board.scrollLeft, 
        mouse.startY + board.scrollTop, 
        mouse.x + board.scrollLeft, 
        mouse.y + board.scrollTop
      )
      return disableArea()
    };
    
    enableArea(mouse.startX, mouse.startY, mouse.x, mouse.y, "oval")
  }, [mouse.x, mouse.y, mouse.isDown]);
}