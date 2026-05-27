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
  });

  const latestCallback = useRef(callback);
  useEffect(() => { latestCallback.current = callback; }); 

  // Gets starting position when mouse is down
  const handleMouseDown = (e) => {
    mouse.current = {
      ...mouse.current,
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
    }

    if (latestCallback.current.active) latestCallback.current.onDown?.(mouse.current);
  };

  // Gets current position when mouse is moving
  const handleMouseDrag = (e) => {
    if (!mouse.current.isDown) return;
    mouse.current = { 
      ...mouse.current,
      x: e.clientX, 
      y: e.clientY 
    }
    if (latestCallback.current.active) latestCallback.current.onDrag?.(mouse.current)
  };

  // Sets isDown to false when mouse is up
  const handleMouseUp = () => {
    mouse.current = { 
      ...mouse.current,
      isDown: false 
    }
    if (latestCallback.current.active) latestCallback.current.onUp?.(mouse.current)
  };

  useEffect(() => {
    if (!latestCallback.current.active) return;

    const board = ref.current;

    board.addEventListener('mousedown', handleMouseDown);
    board.addEventListener('mousemove', handleMouseDrag);
    board.addEventListener('mouseup', handleMouseUp);

    return () => {
      mouse.current.isDown = false;
      board.removeEventListener('mousedown', handleMouseDown);
      board.removeEventListener('mousemove', handleMouseDrag);
      board.removeEventListener('mouseup', handleMouseUp);
    };

  }, [callback.active])
}