import { useEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import useBoard from '../../utils/hooks/useBoard';
import useMoveTool from '../../utils/hooks/useMoveTool';
import useShapeTool from '../../utils/hooks/useShapeTool';
import useArea from '../../utils/hooks/useArea';
import Area from '../Area/Area';
import useContent from '../../utils/hooks/useContent';
import Shape from '../Shape/Shape';

export default function Board({activeTool, setActiveTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [boardState, scrollTo, scrollBy] = useBoard(boardRef, canvasRef);
  const [area, enableArea, disableArea] = useArea();

  const [content, addElement, clearContent] = useContent([]);

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
    enableArea, 
    disableArea, 
    addElement
  )

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef}>
        {area.isVisible && <Area 
          mode={area.mode}
          startX={area.startX + boardState.x}
          startY={area.startY + boardState.y}
          x={area.x + boardState.x}
          y={area.y + boardState.y}
        />}

        {content.map(el => <Shape 
          type={el.type}
          startX={el.startX}
          startY={el.startY}
          x={el.x}
          y={el.y}
        />)}
      </div>
    </div> 
  )
}