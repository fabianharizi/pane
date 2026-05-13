import { useEffect, useRef, useState } from 'react';
import styles from './Board.module.css'
import { HeartIcon } from 'lucide-react';
import Shape from '../Shape/Shape';
import MouseInfo from '../../utils/MouseInfo';
import Area from '../Area/Area';

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

    let boardPos = {x: 0, y: 0}
    let m = new MouseInfo();
    
    switch (activeTool) {
      case "move":
        board.style.cursor = "grab"
        
        const moveMouseDown = (e) => {
          e.preventDefault();
          m.start(e);
          board.style.cursor = "grabbing"
          boardPos = {x: board.scrollLeft, y: board.scrollTop}
        };

        const moveMouseMove = (e) => {
          if(m.isDragging){
            board.scrollTo(boardPos.x + m.offset.x, boardPos.y + m.offset.y)
          }
        };

        const moveMouseUp = (e) => {
          board.style.cursor = "grab"
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
        m = new MouseInfo();

        const rectMouseDown = (e) => {
          e.preventDefault();
          m.start(e);
          boardPos = {x: board.scrollLeft, y: board.scrollTop}
        };

        const rectMouseMove = (e) => {
          if(m.isDragging){
            setArea({
              shape: "rect",
              x: m.coords.x + boardPos.x + Math.min(-(m.offset.x), 0),
              y: m.coords.y + boardPos.y + Math.min(-(m.offset.y), 0),
              width: Math.abs(m.offset.x),
              height: Math.abs(m.offset.y)
            })
          }
        };

        const rectMouseUp = (e) => {
          setElements(prev => [...prev, {
            shape: "rect",
            x: m.coords.x + boardPos.x + Math.min(-(m.offset.x), 0),
            y: m.coords.y + boardPos.y + Math.min(-(m.offset.y), 0),
            width: Math.abs(m.offset.x),
            height: Math.abs(m.offset.y)
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
        {area ? <Area 
          x={area.x}
          y={area.y}
          width={area.width}
          height={area.height}
        /> : ""}
      </div>
    </div> 
  )
}