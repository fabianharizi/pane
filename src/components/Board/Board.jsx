import { useEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import { HeartIcon } from 'lucide-react';
import Shape from '../Shape/Shape';

export default function Board({activeTool, setActiveTool}){
  const boardRef = useRef(null);
  const canvasRef = useRef(null);

  const [elements, setElements] = useState([])
  const [area, setArea] = useState(null)

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

    let isDragging = false;
    let boardPos = {x: 0, y: 0}
    let coords = {x: 0, y: 0};
    let offset = {x: 0, y: 0};
    
    switch (activeTool) {
      case "move":
        board.style.cursor = "grab"

        const moveMouseDown = (e) => {
          board.style.cursor = "grabbing"
          e.preventDefault();
          isDragging = true;
          boardPos = {x: board.scrollLeft, y: board.scrollTop}
          coords = {x: e.clientX, y: e.clientY};
          console.log("Started at X:"+coords.x+" Y:"+coords.y)
        };

        const moveMouseMove = (e) => {
          if(isDragging == true){
            offset = {
              x: coords.x - e.clientX,
              y: coords.y - e.clientY
            }
            board.scrollTo(boardPos.x + offset.x, boardPos.y + offset.y)
            console.log("Moving by X:"+offset.x+" Y:"+offset.y)
          }
        };

        const moveMouseUp = (e) => {
          isDragging = false;
          board.style.cursor = "grab"
          console.log("Mouse Up")
        };

        board.addEventListener('mousedown', moveMouseDown);
        board.addEventListener('mousemove', moveMouseMove);
        board.addEventListener('mouseup', moveMouseUp);
        return () => {board.removeEventListener('mousedown', moveMouseDown)
                      board.removeEventListener('mousemove', moveMouseMove)
                      board.removeEventListener('mouseup', moveMouseUp)};
        break;

      case ("rectangle"):
        board.style.cursor = "crosshair"

        const rectMouseDown = (e) => {
          e.preventDefault();
          isDragging = true;
          boardPos = {x: board.scrollLeft, y: board.scrollTop}
          coords = {x: e.clientX, y: e.clientY};
          console.log("Started at X:"+coords.x+" Y:"+coords.y)
        };

        const rectMouseMove = (e) => {
          if(isDragging == true){
            offset = {
              x: -(coords.x - e.clientX),
              y: -(coords.y - e.clientY)
            }
            setArea({
              shape: "rect",
              x: coords.x + boardPos.x + Math.min(offset.x, 0),
              y: coords.y + boardPos.y + Math.min(offset.y, 0),
              width: Math.abs(offset.x),
              height: Math.abs(offset.y)
            })
            console.log("Moving by X:"+offset.x+" Y:"+offset.y)
          }
        };

        const rectMouseUp = (e) => {
          isDragging = false;
          console.log("Mouse Up")
          setElements(prev => [...prev, {
            shape: "rect",
            x: coords.x + boardPos.x + Math.min(offset.x, 0),
            y: coords.y + boardPos.y + Math.min(offset.y, 0),
            width: Math.abs(offset.x),
            height: Math.abs(offset.y)
          }])
          setArea(null)
          setActiveTool("select")
        };

        board.addEventListener('mousedown', rectMouseDown);
        board.addEventListener('mousemove', rectMouseMove);
        board.addEventListener('mouseup', rectMouseUp);
        return () => {board.removeEventListener('mousedown', rectMouseDown)
                      board.removeEventListener('mousemove', rectMouseMove)
                      board.removeEventListener('mouseup', rectMouseUp)};

        break;
    
      default:
        board.style.cursor = "initial"
        break;
    }
  }, [activeTool]);

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef}>
        {elements.map(el => <Shape 
          shape={el.shape}
          x={el.x}
          y={el.y}
          width={el.width}
          height={el.height}
        />)}
        {area ? <Shape 
          shape={area.shape}
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
        /> : ""}
      </div>
    </div> 
  )
}