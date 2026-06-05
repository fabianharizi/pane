import { useState } from "react";

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

  const encodeContent = (content) => {
    let c = content ? content : this.content
    
    return c.map(el => {
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
    })
  }

  return [content, addElement, clearContent, encodeContent];
}