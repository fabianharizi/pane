import { useState, useRef, useEffect } from "react";

// This hook is used to get and update Mouse position information such as is pressed and coordinates

export default function useMouse(ref) {
  const [mouseState, setMouseState] = useState({
    isDown: false,
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    cursor: 'default',
  });

  // Ref should be changed along with the state so that they aren't different to one another
  const isDown = useRef(false);


  // Function to set the type of cursor
  const setCursor = (cursor) => {
    setMouseState(prev => ({ ...prev, cursor }));
  };

  useEffect(() => {
    if (ref?.current) ref.current.style.cursor = mouseState.cursor;
  }, [mouseState.cursor]);

  // Gets starting position when mouse is down
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

  // Gets current position when mouse is moving
  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    setMouseState((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  // Sets isDown to false when mouse is up
  const handleMouseUp = () => {
    isDown.current = false;
    setMouseState((prev) => ({ ...prev, isDown: false }));
  };

  return [mouseState, handleMouseDown, handleMouseMove, handleMouseUp, setCursor];
}