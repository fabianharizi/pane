import { useRef, useEffect } from "react";

// This hook wires pointerdown/move/up listeners on ref.current and delivers them to the consumer's callbacks while active is true. Reset on deactivation.

// Callback object  {
//                    active,
//                    onDown: (m) => {...},
//                    onDrag: (m) => {...},
//                    onUp: (m) => {...}
//                  }

export default function usePointer(ref, callback) {
  const pointer = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    hasDragged: false,
    target: null
  });

  const latestCallback = useRef(callback);
  useEffect(() => { latestCallback.current = callback; }); 

  // Cursor type handling

  const setCursor = (type) => {ref.current.style.cursor = type ?? latestCallback.current.cursor ?? 'default'}

  // Gets starting position when pointer is down
  const handleDown = (e) => {
    if (!e.isPrimary || e.button !== 0 || !latestCallback.current.active) return;
    
    ref.current.setPointerCapture(e.pointerId)

    latestCallback.current.onDown?.(
      pointer.current = {
        ...pointer.current,
        isDown: true,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        hasDragged: false,
        target: e.target, 
    }, setCursor);
  };

  // Gets current position when pointer is dragging
  const handleMove = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;

    // `target` is deliberately NOT updated here: while a pointer is captured every
    // move is retargeted to `ref`, so this would overwrite the real pointerdown
    // target (which onClick relies on) with the board div.
    latestCallback.current.onMove?.(
      pointer.current = {
        ...pointer.current,
        x: e.clientX,
        y: e.clientY,
        hasDragged: pointer.current.isDown && Math.hypot(e.clientX - pointer.current.startX, e.clientY - pointer.current.startY) > 4,
    }, setCursor)
  };

  // Sets isDown to false when pointer is up
  const handleUp = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;
    
    latestCallback.current.onUp?.(
      pointer.current = { 
        ...pointer.current,
        isDown: false 
    }, setCursor)
  };

  // Sets isDown to false when pointer is up
  const handleCancel = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;
    
    latestCallback.current.onCancel?.(
      pointer.current = { 
        ...pointer.current,
        isDown: false 
    }, setCursor)
  };

  // Gets starting position when pointer is clicked
  const handleClick = (e) => {
    if (pointer.current.hasDragged || !latestCallback.current.active) return;

    latestCallback.current.onClick?.(
      pointer.current = {
        ...pointer.current,
        isDown: true,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
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
      pointer.current.isDown = false;
      board.style.cursor = 'default';
      board.removeEventListener('pointerdown', handleDown);
      board.removeEventListener('pointermove', handleMove);
      board.removeEventListener('pointerup', handleUp);
      board.removeEventListener('pointercancel', handleCancel);
      board.removeEventListener('click', handleClick);
    };

  }, [callback.active])
}