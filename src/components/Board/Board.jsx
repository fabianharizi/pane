import { useEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import useBoard from '../../utils/hooks/useBoard';
import useMoveTool from '../../utils/hooks/useMoveTool';

export default function Board({activeTool, setActiveTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [boardState, scrollTo, scrollBy] = useBoard(boardRef, canvasRef);

  // Install Tool Hooks
  useMoveTool(boardRef, scrollTo, activeTool === 'move')

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef}>
        
      </div>
    </div> 
  )
}