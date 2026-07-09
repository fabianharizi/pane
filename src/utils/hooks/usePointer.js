import { useRef, useEffect } from "react";

// This hook wires mousedown/move/up listeners on ref.current and delivers them to the consumer's callbacks while active is true. Reset on deactivation.

// Callback object  {
//                    active,
//                    onDown: (m) => {...},
//                    onDrag: (m) => {...},
//                    onUp: (m) => {...}
//                  }

export default function usePointer(ref, callback) {
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
  const handleDown = (e) => {
    if (!e.isPrimary || e.button !== 0 || !latestCallback.current.active) return;
    
    ref.current.setPointerCapture(e.pointerId)

    latestCallback.current.onDown?.(
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
  const handleMove = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;
    
    latestCallback.current.onMove?.(
      mouse.current = { 
        ...mouse.current,
        x: e.clientX, 
        y: e.clientY,
        hasDragged: mouse.current.isDown && Math.hypot(e.clientX - mouse.current.startX, e.clientY - mouse.current.startY) > 4,
        target: e.target
    }, setCursor)
  };

  // Sets isDown to false when mouse is up
  const handleUp = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;
    
    latestCallback.current.onUp?.(
      mouse.current = { 
        ...mouse.current,
        isDown: false 
    }, setCursor)
  };

  // Sets isDown to false when mouse is up
  const handleCancel = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;
    
    latestCallback.current.onCancel?.(
      mouse.current = { 
        ...mouse.current,
        isDown: false 
    }, setCursor)
  };

  // Gets starting position when mouse is clicked
  const handleClick = (e) => {
    if (mouse.current.hasDragged || !latestCallback.current.active) return;

    latestCallback.current.onClick?.(
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

    board.addEventListener('pointerdown', handleDown);
    board.addEventListener('pointermove', handleMove);
    board.addEventListener('pointerup', handleUp);
    board.addEventListener('pointercancel', handleCancel);
    board.addEventListener('click', handleClick);

    return () => {
      mouse.current.isDown = false;
      board.style.cursor = 'default';
      board.removeEventListener('mousedown', handleDown);
      board.removeEventListener('mousemove', handleMove);
      board.removeEventListener('mouseup', handleUp);
      board.removeEventListener('pointercancel', handleCancel);
      board.removeEventListener('click', handleClick);
    };

  }, [callback.active])
}