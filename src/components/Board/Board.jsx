import { useEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import useBoard from '../../utils/hooks/useBoard';
import useMoveTool from '../../utils/tools/useMoveTool';
import useShapeTool from '../../utils/tools/useShapeTool';
import useLineTool from '../../utils/tools/useLineTool';
import usePreview from '../../utils/hooks/usePreview';
import Preview from '../Preview/Preview';
import useContent from '../../utils/hooks/useContent';
import Shape from '../Shape/Shape';
import Line from '../Line/Line';

export default function Board({activeTool, setActiveTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [boardState, scrollTo, scrollBy] = useBoard(boardRef, canvasRef);
  const [preview, enablePreview, disablePreview] = usePreview();

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
    enablePreview, 
    disablePreview, 
    addElement
  )
  useLineTool(
    boardRef, 
    activeTool === 'line', 
    enablePreview, 
    disablePreview, 
    addElement
  )

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef}>
        {preview.isVisible && <Preview 
          mode={preview.mode}
          startX={preview.startX + boardState.x}
          startY={preview.startY + boardState.y}
          x={preview.x + boardState.x}
          y={preview.y + boardState.y}
        />}

        {content.map(el => {
          switch(el.type){
            case "rectangle":
            case "oval":
              return <Shape 
                type={el.type}
                startX={el.startX}
                startY={el.startY}
                x={el.x}
                y={el.y}
              />

            case "line":
              return <Line
                startX={el.startX}
                startY={el.startY}
                x={el.x}
                y={el.y}
              />
          }
        })}
      </div>
    </div> 
  )
}