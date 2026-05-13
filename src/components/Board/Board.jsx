import { useEffect, useRef } from 'react';
import styles from './Board.module.css'

export default function Board({activeTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;

    canvas.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });
  },[])

  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;

    switch (activeTool) {
      case "move":
        let isDragging = false;
        let boardPos = {x: 0, y: 0}
        let coords = {x: 0, y: 0};
        let offset = {x: 0, y: 0};

        board.style.cursor = "grab"

        const handleMouseDown = (e) => {
          board.style.cursor = "grabbing"
          e.preventDefault();
          isDragging = true;
          boardPos = {x: board.scrollLeft, y: board.scrollTop}
          coords = {x: e.clientX, y: e.clientY};
          // console.log("Started at X:"+coords.x+" Y:"+coords.y)
        };

        const handleMouseMove = (e) => {
          if(isDragging == true){
            offset = {
              x: coords.x - e.clientX,
              y: coords.y - e.clientY
            }
            board.scrollTo(boardPos.x + offset.x, boardPos.y + offset.y)
            // console.log("Moving by X:"+offset.x+" Y:"+offset.y)
          }
        };

        const handleMouseUp = (e) => {
          isDragging = false;
          board.style.cursor = "grab"
          // console.log("Mouse Up")
        };

        board.addEventListener('mousedown', handleMouseDown);
        board.addEventListener('mousemove', handleMouseMove);
        board.addEventListener('mouseup', handleMouseUp);
        return () => {board.removeEventListener('mousedown', handleMouseDown)
                      board.removeEventListener('mousemove', handleMouseMove)
                      board.removeEventListener('mouseup', handleMouseUp)};
        break;
    
      default:
        board.style.cursor = "initial"
        break;
    }
  }, [activeTool]);

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef}>
        
      </div>
    </div> 
  )
}