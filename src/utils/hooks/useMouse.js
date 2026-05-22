import { useState, useRef, useEffect } from "react";

export default function useMouse(ref) {
  const [mouseState, setMouseState] = useState({
    isDown: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    cursor: 'default',
  });

  const isDown = useRef(false);

  const setCursor = (cursor) => {
    setMouseState(prev => ({ ...prev, cursor }));
  };

  useEffect(() => {
    if (ref?.current) ref.current.style.cursor = mouseState.cursor;
  }, [mouseState.cursor]);

  const handleMouseDown = (e) => {
    isDown.current = true;
    setMouseState(prev => ({
      ...prev,
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
    }));
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    setMouseState((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  const handleMouseUp = () => {
    isDown.current = false;
    setMouseState((prev) => ({ ...prev, isDown: false }));
  };

  return [mouseState, handleMouseDown, handleMouseMove, handleMouseUp, setCursor];
}