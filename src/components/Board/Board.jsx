import { useEffect, useRef } from 'react';
import './Board.css'

export default function Board(){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const board = boardRef.current;
    const canvas = canvasRef.current;

    if(board){
      let isDragging = false;
      let boardPos = {x: 0, y: 0}
      let coords = {x: 0, y: 0};
      let offset = {x: 0, y: 0};

      const handleMouseDown = (e) => {
        e.preventDefault();
        if(e.button === 1){
          isDragging = true;
          boardPos = {x: board.scrollLeft, y: board.scrollTop}
          coords = {x: e.clientX, y: e.clientY};
          console.log("Started at X:"+coords.x+" Y:"+coords.y)
        }
      };

      const handleMouseMove = (e) => {
        if(isDragging == true){
          offset = {
            x: coords.x - e.clientX,
            y: coords.y - e.clientY
          }
          board.scrollTo(boardPos.x + offset.x, boardPos.y + offset.y)
          console.log("Moving by X:"+offset.x+" Y:"+offset.y)
        }
      };

      const handleMouseUp = (e) => {
        isDragging = false;
        console.log("Mouse Up")
      };

      board.addEventListener('mousedown', handleMouseDown);
      board.addEventListener('mousemove', handleMouseMove);
      board.addEventListener('mouseup', handleMouseUp);
      return () => {board.removeEventListener('mousedown', handleMouseDown)
                    board.removeEventListener('mousemove', handleMouseMove)
                    board.removeEventListener('mouseup', handleMouseUp)};
    }
  }, []);

  return (
    <div className="board" ref={boardRef}>
      <div className="canvas" ref={canvasRef}>
        
      </div>
    </div> 
  )
}