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

  // True once this instance has seen the pointerdown of the current gesture. Guards
  // onClick against the stray `click` that fires when a tool activates mid-gesture
  // (e.g. a draw tool commits and switches to select, whose click listener then
  // catches the draw's trailing click with a stale target).
  const sawDown = useRef(false);

  // Cursor type handling

  const setCursor = (type) => {ref.current.style.cursor = type ?? latestCallback.current.cursor ?? 'default'}

  // Gets starting position when pointer is down
  const handleDown = (e) => {
    if (!e.isPrimary || e.button !== 0 || !latestCallback.current.active) return;
    
    e.stopPropagation();
    ref.current.setPointerCapture(e.pointerId)
    sawDown.current = true;

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
        shiftKey: e.shiftKey,
    }, setCursor);
  };

  // Gets current position when pointer is dragging
  const handleMove = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;

    // Missed pointerup safety net: if we still think we're dragging but no button
    // is held, capture was lost and the up never reached us. Finalize the gesture
    // instead of resuming a phantom drag on hover.
    if (pointer.current.isDown && e.buttons === 0) {
      latestCallback.current.onUp?.(
        pointer.current = { ...pointer.current, isDown: false },
        setCursor
      );
      return;
    }

    // `target` is deliberately NOT updated here: while a pointer is captured every
    // move is retargeted to `ref`, so this would overwrite the real pointerdown
    // target (which onClick relies on) with the element.
    latestCallback.current.onMove?.(
      pointer.current = {
        ...pointer.current,
        x: e.clientX,
        y: e.clientY,
        hasDragged: pointer.current.isDown && Math.hypot(e.clientX - pointer.current.startX, e.clientY - pointer.current.startY) > 4,
        shiftKey: e.shiftKey,
    }, setCursor)
  };

  // Sets isDown to false when pointer is up
  const handleUp = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;

    if (ref.current.hasPointerCapture?.(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);

    // Only finalize a gesture this instance started. A pointerup can arrive
    // without a matching pointerdown here — the press began on another element
    // (a UI button slid off), under another tool (switched away mid-press), or
    // with a non-left button that handleDown filtered — and firing onUp then
    // would hand the tool a stale pointer snapshot (phantom commits).
    if (!pointer.current.isDown) return;

    latestCallback.current.onUp?.(
      pointer.current = {
        ...pointer.current,
        isDown: false
    }, setCursor)
  };

  // Capture can be lost for reasons other than pointerup (element detach, browser
  // intervention). Reset so a subsequent hover can't resume a phantom drag.
  const handleLostCapture = () => {
    pointer.current = { ...pointer.current, isDown: false };
  };

  // Sets isDown to false when pointer is up
  const handleCancel = (e) => {
    if (!e.isPrimary || !latestCallback.current.active) return;
    
    sawDown.current = false;
    latestCallback.current.onCancel?.(
      pointer.current = {
        ...pointer.current,
        isDown: false
    }, setCursor)
  };

  // Gets starting position when pointer is clicked
  const handleClick = (e) => {
    if (!latestCallback.current.active) return;

    // Stop before the hasDragged short-circuit: the click that fires at the end of
    // a handle drag must not bubble to the board (it would deselect the element).
    e.stopPropagation();

    // Only act on a click whose pointerdown this instance actually saw; ignore a
    // stray click inherited from a gesture that started under another tool.
    const sawGesture = sawDown.current;
    sawDown.current = false;
    if (!sawGesture || pointer.current.hasDragged) return;

    // Deliberately leaves isDown alone (false since the pointerup): a click is
    // not a gesture in progress, and re-marking it down would re-arm the
    // missed-pointerup safety net into a spurious onUp on the next hover move.
    latestCallback.current.onClick?.(
      pointer.current = {
        ...pointer.current,
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
    }, setCursor);
  };

  const handleDblClick = (e) => {
    if (!latestCallback.current.active) return;

    e.stopPropagation();
    if (pointer.current.hasDragged) return;

    latestCallback.current.onDblClick?.(
      pointer.current = {
        ...pointer.current,
        x: e.clientX,
        y: e.clientY,
    }, setCursor);
  };


  useEffect(() => {
    if (!latestCallback.current.active) return;

    const element = ref.current;

    setCursor();

    element.addEventListener('pointerdown', handleDown);
    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerup', handleUp);
    element.addEventListener('pointercancel', handleCancel);
    element.addEventListener('lostpointercapture', handleLostCapture);
    element.addEventListener('click', handleClick);
    element.addEventListener('dblclick', handleDblClick);

    return () => {
      pointer.current.isDown = false;
      sawDown.current = false;
      element.style.cursor = 'default';
      element.removeEventListener('pointerdown', handleDown);
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerup', handleUp);
      element.removeEventListener('pointercancel', handleCancel);
      element.removeEventListener('lostpointercapture', handleLostCapture);
      element.removeEventListener('click', handleClick);
      element.removeEventListener('dblclick', handleDblClick);
    };

  }, [callback.active])
}