import { useEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import useBoard from '../../utils/hooks/useBoard';
import useMoveTool from '../../utils/hooks/useMoveTool';
import useArea from '../../utils/hooks/useArea';
import Area from '../Area/Area';
import useShapeTool from '../../utils/hooks/useShapeTool';

export default function Board({activeTool, setActiveTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [boardState, scrollTo, scrollBy] = useBoard(boardRef, canvasRef);
  const [area, enableArea, disableArea] = useArea();

  // Install Tool Hooks
  useMoveTool(boardRef, scrollTo, activeTool === 'move')
  useShapeTool(boardRef, enableArea, disableArea, activeTool === 'rectangle')

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef}>
        {area.isVisible && <Area 
          mode={"rectangle"}
          startX={area.startX + boardState.x}
          startY={area.startY + boardState.y}
          x={area.x + boardState.x}
          y={area.y + boardState.y}
        />}
      </div>
    </div> 
  )
}