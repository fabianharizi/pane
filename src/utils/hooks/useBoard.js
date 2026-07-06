import { useState, useEffect, useRef, useLayoutEffect } from "react";

// This hook is used to get and update board's info such as scroll position, size and coordinates

export default function useBoard(boardRef, canvasRef, content) {
  const [boardState, setBoardState] = useState({
    width: 0,
    height: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    x: 0,
    y: 0,
    canvasSize: 5000
  });

  // Scroll board to the center and track scroll when moved manually
  useEffect(() => {
    const board = boardRef.current;

    // initial scroll to center
    board.scrollTo({
      left: (board.scrollWidth - board.offsetWidth) / 2,
      top: (board.scrollHeight - board.offsetHeight) / 2,
    });

    // scroll tracking
    const handleScroll = () => {
      setBoardState(prev => ({ ...prev, x: board.scrollLeft, y: board.scrollTop }));
    };

    board.addEventListener('scroll', handleScroll);
    return () => board.removeEventListener('scroll', handleScroll);
  }, []);


  // Track width, height on board size change
  useEffect(() => {
    const board = boardRef.current;

    const observer = new ResizeObserver(() => {
      setBoardState(prev => ({
        ...prev,
        width: board.offsetWidth,
        height: board.offsetHeight,
        scrollWidth: board.scrollWidth,
        scrollHeight: board.scrollHeight,
      }));
    });

    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  // Track scroll width, scroll height on canvas size change
  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;

    const observer = new ResizeObserver(() => {
      setBoardState(prev => ({
        ...prev,
        width: board.offsetWidth,
        height: board.offsetHeight,
        scrollWidth: board.scrollWidth,
        scrollHeight: board.scrollHeight,
      }));
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Functions to control scroll position
  const scrollTo = (x, y) => {
    boardRef.current.scrollTo({ left: x, top: y });
  };

  const scrollBy = (x, y) => {
    boardRef.current.scrollBy({ left: x, top: y });
  };

  useEffect(() => {
    if (content.length === 0) return
    const radius = Math.max(
      ...content.map(el =>
        Math.max(Math.abs(el.startX), Math.abs(el.x), Math.abs(el.startY), Math.abs(el.y))
      )
    )
    setBoardState(prev => ({ ...prev, canvasSize: 5000 + radius * 2 }))
  }, [content])

  const prevSize = useRef(boardState.canvasSize);

  useLayoutEffect(() => {
    const delta = boardState.canvasSize - prevSize.current;
    if (delta !== 0) {
      boardRef.current.scrollBy({ left: delta / 2, top: delta / 2 });
      prevSize.current = boardState.canvasSize;
    }
  }, [boardState.canvasSize]);

  return [boardState, scrollTo, scrollBy];
}