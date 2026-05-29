import { useRef, useEffect, useState } from "react";

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
    cursor: "default",
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

    if (latestCallback.current.active) latestCallback.current.onDown?.(mouse.current, setCursor);
  };

  // Gets current position when mouse is moving
  const handleMouseDrag = (e) => {
    if (!mouse.current.isDown) return;
    mouse.current = { 
      ...mouse.current,
      x: e.clientX, 
      y: e.clientY 
    }
    if (latestCallback.current.active) latestCallback.current.onDrag?.(mouse.current, setCursor)
  };

  // Sets isDown to false when mouse is up
  const handleMouseUp = () => {
    mouse.current = { 
      ...mouse.current,
      isDown: false 
    }
    if (latestCallback.current.active) latestCallback.current.onUp?.(mouse.current, setCursor)
  };

  useEffect(() => {
    if (!latestCallback.current.active) return;

    const board = ref.current;

    board.style.cursor = latestCallback.current.cursor;

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

  
  // Cursor type handling

  const [cursorType, setCursorType] = useState(mouse.current.cursor)
  const setCursor = (type) => (type ? setCursorType(type) : setCursorType(latestCallback.current.cursor))

  useEffect(() => {
    const board = ref.current;
    board.style.cursor = cursorType;
  }, [cursorType])
}