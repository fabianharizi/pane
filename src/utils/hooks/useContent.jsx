import { useState } from "react";
import Shape from '../../components/Shape/Shape';
import Line from '../../components/Line/Line';
import Text from "../../components/Text/Text";

// This hook is used to keep track of the contents of the canvas.
// Selection is uniformly MULTI: `selectedElements` is an array of uuids and
// every operation takes an array — a single element is just a selection of
// length 1. There are deliberately no singular variants.

export default function useContent(start){
  const [content, setContent] = useState(start)
  const [selectedElements, setSelectedElements] = useState([])

  const hasElement = (uuid) => content.some(el => el.uuid === uuid);

  const getElement = (uuid) => content.find(el => el.uuid === uuid);

  // Appends elements and selects exactly them — a draw or a paste becomes the
  // active selection. Takes [{ type, uuid, properties }].
  const addElements = (list) => {
    setContent(prev => ([
      ...prev.map(el => ({ ...el, selected: false })),
      ...list.map(e => ({
        type: e.type,
        uuid: e.uuid,
        selected: true,
        properties: e.properties
      }))
    ]))
    setSelectedElements(list.map(e => e.uuid))
  }

  // Selects exactly the given uuids (unknown ids are dropped). An empty or
  // absent list deselects everything.
  const selectElements = (uuids) => {
    const valid = (uuids ?? []).filter(hasElement);

    setSelectedElements(valid)
    setContent(prev => prev.map((el) => ({
      ...el,
      selected: valid.includes(el.uuid)
    })))
  }

  // Merges per-element property patches in one state pass.
  // Takes [{ uuid, properties }].
  const updateElements = (patches) => {
    setContent(prev => prev.map(el => {
      const patch = patches.find(pt => pt.uuid === el.uuid)
      return patch
        ? { ...el, properties: { ...el.properties, ...patch.properties } }
        : el
    }))
  }

  const deleteElements = (uuids) => {
    setContent(prev => prev.filter(el => !uuids.includes(el.uuid)));
    setSelectedElements(prev => prev.filter(id => !uuids.includes(id)));
  }

  const clearContent = () => {
    setContent([])
    setSelectedElements([])
  }

  const encodeContent = (content) => {
    return content.map(el => {
      // Stored coords ARE world coords — the camera transform on the world div
      // handles all screen mapping, so properties pass through untouched.
      const properties = el.properties

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
    "selectedElements": selectedElements,
    "hasElement": hasElement,
    "getElement": getElement,
    "addElements": addElements,
    "selectElements": selectElements,
    "updateElements": updateElements,
    "deleteElements": deleteElements,
    "clearContent": clearContent,
    "encodeContent": encodeContent
  };
}
