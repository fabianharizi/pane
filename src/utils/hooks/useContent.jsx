import { useRef, useState } from "react";
import Shape from '../../components/Shape/Shape';
import Line from '../../components/Line/Line';
import Text from "../../components/Text/Text";
import UUID from "../methods/UUID";

// This hook is used to keep track of the contents of the canvas

export default function useContent(start){
  const [content, setContent] = useState(start)
  const [selectedElement, setSelectedElement] = useState()

  const addElement = (type, uuid, properties) => {
    setContent(prev => ([...prev, {
      type: type,
      uuid: uuid,
      selected: false,
      properties: properties
    }]))
  }

  const selectElement = (uuid) => {
    if (!hasElement(uuid)) return;

    setContent(prev => prev.map((el) => ({
      ...el,
      selected: (el.uuid === uuid) ? true : false
    })))
  }

  const clearContent = () => {
    setContent([])
  }

  const encodeContent = (content, centerX, centerY) => {
    return content.map(el => {
      // Stored coords are center-relative; add the center back to render at
      // absolute canvas position (inverse of the subtraction done in onUp).
      const properties = {
        ...el.properties,
        startX: el.properties.startX + centerX,
        startY: el.properties.startY + centerY,
        endX: el.properties.endX + centerX,
        endY: el.properties.endY + centerY,
      }

      switch(el.type){
        case "rectangle":
        case "oval":
          return <Shape
            key={el.uuid}
            uuid={el.uuid}
            selected={el.selected}
            type={el.type}
            properties={properties}
          />

        case "line":
          return <Line
            key={el.uuid}
            uuid={el.uuid}
            selected={el.selected}
            properties={properties}
          />

        case "text":
          return <Text
            key={el.uuid}
            uuid={el.uuid}
            selected={el.selected}
            properties={properties}
          />
      }
    })
  }

  const updateElement = (uuid, properties) => {
    if (!hasElement(uuid)) return;

    setContent(prev => prev.map(el =>
      el.uuid === uuid
        ? { ...el, properties: { ...el.properties, ...properties } }
        : el
    ))
  }


  const hasElement = (uuid) => content.some(el => el.uuid === uuid);

  return {
    "content": content,
    "selectedElement": selectedElement,
    "addElement": addElement,
    "selectElement": selectElement,
    "clearContent": clearContent,
    "encodeContent": encodeContent
  };
}