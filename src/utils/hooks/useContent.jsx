import { useState } from "react";
import { resolveLineEndpoints } from "../methods/lineGeometry";

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

  // Deleting a line's binding target BAKES the line first: its resolved
  // endpoint coords (computed against the pre-delete content) are written into
  // the raw coords and the binding is nulled, so the line freezes in place
  // instead of dangling or snapping to its stale fallback position.
  const deleteElements = (uuids) => {
    setContent(prev => {
      const doomed = new Set(uuids)
      const lookup = (uuid) => prev.find(el => el.uuid === uuid)

      return prev
        .filter(el => !doomed.has(el.uuid))
        .map(el => {
          if (el.type !== "line") return el
          const startDead = el.properties.startBinding && doomed.has(el.properties.startBinding.uuid)
          const endDead = el.properties.endBinding && doomed.has(el.properties.endBinding.uuid)
          if (!startDead && !endDead) return el

          const r = resolveLineEndpoints(el.properties, lookup)
          return {
            ...el,
            properties: {
              ...el.properties,
              startX: r.startX, startY: r.startY,
              endX: r.endX, endY: r.endY,
              ...(startDead ? { startBinding: null } : {}),
              ...(endDead ? { endBinding: null } : {}),
            }
          }
        })
    });
    setSelectedElements(prev => prev.filter(id => !uuids.includes(id)));
  }

  const clearContent = () => {
    setContent([])
    setSelectedElements([])
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
    "clearContent": clearContent
  };
}
