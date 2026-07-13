import { useRef, useState } from "react";
import Shape from '../../components/Shape/Shape';
import Line from '../../components/Line/Line';
import Text from "../../components/Text/Text";
import UUID from "../methods/UUID";

// This hook is used to keep track of the contents of the canvas

export default function useContent(start){
  const [content, setContent] = useState(start)
  const [selectedElement, setSelectedElement] = useState(null)
  const [copied, setCopied] = useState()

  const hasElement = (uuid) => content.some(el => el.uuid === uuid);

  const getElement = (uuid) => content.find(el => el.uuid === uuid);

  // Adding an element selects it (and deselects the rest), so a freshly drawn
  // shape/line/text is immediately the active selection.
  const addElement = (type, uuid, properties) => {
    setContent(prev => ([
      ...prev.map(el => ({ ...el, selected: false })),
      {
        type: type,
        uuid: uuid,
        selected: true,
        properties: properties
      }
    ]))
    setSelectedElement(uuid)
  }

  // Single-select. Any id that doesn't match an element (e.g. `null` from a click
  // on empty canvas) deselects everything.
  const selectElement = (uuid) => {
    const exists = hasElement(uuid);

    setSelectedElement(exists ? uuid : null)
    setContent(prev => prev.map((el) => ({
      ...el,
      selected: exists && el.uuid === uuid
    })))
  }

  const updateElement = (uuid, properties) => {
    if (!hasElement(uuid)) return;

    setContent(prev => prev.map(el =>
      el.uuid === uuid
        ? { ...el, properties: { ...el.properties, ...properties } }
        : el
    ))
  }

  const deleteElement = (uuid) => {
    setContent(prev => prev.filter(el => el.uuid !== uuid));
    setSelectedElement(prev => (prev === uuid ? null : prev));
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

  return {
    "content": content,
    "selectedElement": selectedElement,
    "hasElement": hasElement,
    "getElement": getElement,
    "addElement": addElement,
    "selectElement": selectElement,
    "updateElement": updateElement,
    "deleteElement": deleteElement,
    "clearContent": clearContent,
    "encodeContent": encodeContent
  };
}