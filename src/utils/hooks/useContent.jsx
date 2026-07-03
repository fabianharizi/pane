import { useState } from "react";
import Shape from '../../components/Shape/Shape';
import Line from '../../components/Line/Line';

// This hook is used to keep track of the contents of the canvas

export default function useContent(start){
  const [content, setContent] = useState(start)

  const addElement = (type, startX, startY, x, y) => {
    setContent(prev => ([...prev, {
      type: type,
      startX: startX,
      startY: startY,
      x: x,
      y: y
    }]))
  }

  const clearContent = () => {
    setContent([])
  }

  const encodeContent = (content, centerX, centerY) => {
    let c = content ? content : this.content
    
    return c.map(el => {
      switch(el.type){
        case "rectangle":
        case "oval":
          return <Shape 
            type={el.type}
            startX={el.startX + centerX}
            startY={el.startY + centerY}
            x={el.x + centerX}
            y={el.y + centerY}
          />
  
        case "line":
          return <Line
            startX={el.startX + centerX}
            startY={el.startY + centerY}
            x={el.x + centerX}
            y={el.y + centerY}
          />
      }
    })
  }

  return [content, addElement, clearContent, encodeContent];
}