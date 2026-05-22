import { useState, useEffect } from "react";

export default function useBoard(boardRef, canvasRef) {
  const [boardState, setBoardState] = useState({
    width: 0,
    height: 0,
    scrollWidth: 0,
    scrollHeight: 0,
    x: 0,
    y: 0,
  });

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

  useEffect(() => {
    const board = boardRef.current;

    // size tracking
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

    observer.observe(canvas); // watch canvas, read board
    return () => observer.disconnect();
  }, []);

  const scrollTo = (x, y) => {
    boardRef.current.scrollTo({ left: x, top: y });
  };

  const scrollBy = (x, y) => {
    boardRef.current.scrollBy({ left: x, top: y });
  };

  useEffect(() => {
    console.log(boardState);
  }, [boardState]);

  return [boardState, scrollTo, scrollBy];
}