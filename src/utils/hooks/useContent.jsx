import { useRef, useState } from "react";
import Shape from '../../components/Shape/Shape';
import Line from '../../components/Line/Line';
import Text from "../../components/Text/Text";
import UUID from "../methods/UUID";

// This hook is used to keep track of the contents of the canvas

export default function useContent(start){
  const [content, setContent] = useState(start)

  const addElement = (type, uuid, startX, startY, x, y, properties) => {
    setContent(prev => ([...prev, {
      type: type,
      uuid: uuid,
      selected: false,
      startX: startX,
      startY: startY,
      x: x,
      y: y,
      properties: properties
    }]))
  }

  const selectElement = (uuid) => {
    setContent(prev => prev.map((el) => ({
      ...el,
      selected: (UUID.validate(uuid) && el.uuid == uuid) ? true : false
    })))
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
            key={el.uuid}
            uuid={el.uuid}
            selected={el.selected}
            type={el.type}
            startX={el.startX + centerX}
            startY={el.startY + centerY}
            x={el.x + centerX}
            y={el.y + centerY}
            properties={el.properties}
          />
  
        case "line":
          return <Line
            key={el.uuid}
            uuid={el.uuid}
            selected={el.selected}
            startX={el.startX + centerX}
            startY={el.startY + centerY}
            x={el.x + centerX}
            y={el.y + centerY}
          />
  
        case "text":
          return <Text
            key={el.uuid}
            uuid={el.uuid}
            selected={el.selected}
            startX={el.startX + centerX}
            startY={el.startY + centerY}
            x={el.x + centerX}
            y={el.y + centerY}
            content={el.content}
          />
      }
    })
  }

  return {
    "content": content,
    "addElement": addElement,
    "selectElement": selectElement,
    "clearContent": clearContent,
    "encodeContent": encodeContent
  };
}