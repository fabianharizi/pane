import { useRef, useEffect } from "react";

// This hook wires mousedown/move/up listeners on ref.current and delivers them to the consumer's callbacks while active is true. Reset on deactivation.

// Callback object  {
//                    active,
//                    onDown: (m) => {...},
//                    onDrag: (m) => {...},
//                    onUp: (m) => {...}
//                  }

export default function useMouse(ref, callback) {
  const mouse = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    hasDragged: false
  });

  const latestCallback = useRef(callback);
  useEffect(() => { latestCallback.current = callback; }); 

  // Cursor type handling

  const setCursor = (type) => {ref.current.style.cursor = type ?? latestCallback.current.cursor ?? 'default'}

  // Gets starting position when mouse is down
  const handleMouseDown = (e) => {
    if (latestCallback.current.active) latestCallback.current.onDown?.(
      mouse.current = {
        ...mouse.current,
        isDown: true,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        hasDragged: false
    }, setCursor);
  };

  // Gets current position when mouse is dragging
  const handleMouseMove = (e) => {
    if (latestCallback.current.active) latestCallback.current.onMove?.(
      mouse.current = { 
        ...mouse.current,
        x: e.clientX, 
        y: e.clientY,
        hasDragged: mouse.current.isDown ? true : false,
        target: e.target
    }, setCursor)
  };

  // Sets isDown to false when mouse is up
  const handleMouseUp = () => {
    if (latestCallback.current.active) latestCallback.current.onUp?.(
      mouse.current = { 
        ...mouse.current,
        isDown: false 
    }, setCursor)
  };

  // Gets starting position when mouse is clicked
  const handleMouseClick = (e) => {
    if (mouse.current.hasDragged) return;
    if (latestCallback.current.active) latestCallback.current.onClick?.(
      mouse.current = {
        ...mouse.current,
        isDown: true,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        target: e.target
    }, setCursor);
  };

  useEffect(() => {
    if (!latestCallback.current.active) return;

    const board = ref.current;

    setCursor();

    board.addEventListener('mousedown', handleMouseDown);
    board.addEventListener('mousemove', handleMouseMove);
    board.addEventListener('mouseup', handleMouseUp);
    board.addEventListener('click', handleMouseClick);

    return () => {
      mouse.current.isDown = false;
      board.style.cursor = 'default';
      board.removeEventListener('mousedown', handleMouseDown);
      board.removeEventListener('mousemove', handleMouseMove);
      board.removeEventListener('mouseup', handleMouseUp);
      board.removeEventListener('click', handleMouseClick);
    };

  }, [callback.active])
}