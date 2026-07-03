import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import useBoard from '../../utils/hooks/useBoard';
import useMoveTool from '../../utils/tools/useMoveTool';
import useShapeTool from '../../utils/tools/useShapeTool';
import useLineTool from '../../utils/tools/useLineTool';
import usePreview from '../../utils/hooks/usePreview';
import useContent from '../../utils/hooks/useContent';
import Shape from '../Shape/Shape';
import Line from '../Line/Line';

export default function Board({activeTool, setActiveTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [boardState, scrollTo, scrollBy, setSize] = useBoard(boardRef, canvasRef);
  const [preview, enablePreview, disablePreview] = usePreview();

  const [content, addElement, clearContent, encodeContent] = useContent([]);

  // Install Tool Hooks
  useMoveTool(
    boardRef, 
    activeTool === 'move', 
    scrollTo 
  )
  useShapeTool(
    boardRef, 
    activeTool === 'rectangle' || activeTool === 'oval', 
    activeTool,
    enablePreview, 
    disablePreview, 
    addElement,
  )
  useLineTool(
    boardRef, 
    activeTool === 'line', 
    enablePreview, 
    disablePreview, 
    addElement
  )


  useEffect(() => {
    setSize(content)
  }, [content])

  const prevSize = useRef(boardState.canvasSize);

  useLayoutEffect(() => {
    const delta = boardState.canvasSize - prevSize.current;
    if (delta !== 0) {
      boardRef.current.scrollBy({ left: delta / 2, top: delta / 2 });
      prevSize.current = boardState.canvasSize;
    }
  }, [boardState.canvasSize]);

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef} style={{ '--canvas-size': boardState.canvasSize + 'px' }}>
        {preview}
        {encodeContent(content, boardState.canvasSize / 2, boardState.canvasSize / 2)}
      </div>
    </div> 
  )
}