import { useEffect, useRef, useState } from 'react';
import './App.css'
import Board from './components/Board/Board';
import Toolbar from './components/Toolbar/Toolbar';
import Properties from './components/Properties/Properties';
import ZoomBar from './components/ZoomBar/ZoomBar';
import useContent from './utils/hooks/useContent';
import useCamera from './utils/hooks/useCamera';
import usePreview from './utils/hooks/usePreview';
import useSelectTool from './utils/tools/useSelectTool';
import useMoveTool from './utils/tools/useMoveTool';
import useShapeTool from './utils/tools/useShapeTool';
import useLineTool from './utils/tools/useLineTool';
import useTextTool from './utils/tools/useTextTool';
import useShortcuts from './utils/hooks/useShortcuts';
import UUID from './utils/methods/UUID';

const SELECTION_TOOLS = ['select', 'move'];

export default function App(){
  const boardRef = useRef(null);

  const [activeTool, setActiveTool] = useState("select");
  const {content, selectedElements, getElement, addElements, selectElements, updateElements, deleteElements, clearContent} = useContent([]);
  const {camera, panBy, zoomTo, toWorld} = useCamera(boardRef);
  const {preview, enablePreview, disablePreview} = usePreview();
  const clipboard = useRef(null)

  useEffect(() => {
    if (selectedElements.length && !SELECTION_TOOLS.includes(activeTool)) selectElements([]);
  }, [activeTool, selectedElements]);

  // Install Tool Hooks
  useSelectTool(
    boardRef,
    activeTool === 'select',
    content,
    selectElements,
    toWorld,
    enablePreview,
    disablePreview
  )
  useMoveTool(
    boardRef,
    activeTool === 'move',
    panBy
  )
  useShapeTool(
    boardRef,
    activeTool === 'rectangle' || activeTool === 'oval',
    activeTool,
    toWorld,
    enablePreview,
    disablePreview,
    addElements,
    setActiveTool
  )
  useLineTool(
    boardRef,
    activeTool === 'line',
    toWorld,
    enablePreview,
    disablePreview,
    addElements,
    setActiveTool
  )
  useTextTool(
    boardRef,
    activeTool === 'text',
    toWorld,
    enablePreview,
    disablePreview,
    addElements,
    setActiveTool
  )

  // Install shortcuts
  useShortcuts(activeTool, setActiveTool, [
    { shortcut: "delete",    handler: () => { if (selectedElements.length) deleteElements(selectedElements); } },
    { shortcut: "backspace", handler: () => { if (selectedElements.length) deleteElements(selectedElements); } },
    { shortcut: "ctrl+c",    handler: () => {
      if (!selectedElements.length) return;
      // Snapshot type + properties of every selected element (uuids minted on paste).
      clipboard.current = selectedElements
        .map(getElement)
        .filter(Boolean)
        .map(el => ({ type: el.type, properties: { ...el.properties } }))
      }},
    { shortcut: "ctrl+v",    handler: () => {
      if (!clipboard.current?.length) return;
      // Paste the whole group offset by 20px; addElements selects the pasted set.
      addElements(clipboard.current.map(c => ({
        type: c.type,
        uuid: UUID.generate(c.type.slice(0, 4)),
        properties: {
          ...c.properties,
          startX: c.properties.startX + 20,
          startY: c.properties.startY + 20,
          endX: c.properties.endX + 20,
          endY: c.properties.endY + 20,
        }
      })))
      }},
    { shortcut: "ctrl+=",    handler: () => zoomTo(camera.zoom * 1.25) },
    { shortcut: "ctrl+-",    handler: () => zoomTo(camera.zoom / 1.25) },
    { shortcut: "ctrl+0",    handler: () => zoomTo(1) },
  ]);

  return (
    <>
      <main className="container">
        <Board
          boardRef={boardRef}
          content={content}
          camera={camera}
          toWorld={toWorld}
          preview={preview}
          selectedElements={selectedElements}
          getElement={getElement}
          updateElements={updateElements}
          selectionInteractive={activeTool === 'select'}
        />
        <div className="interface">
          <div className="properties">
            <Properties
              selectedElements={selectedElements}
              getElement={getElement}
              updateElements={updateElements}
            />
          </div>
          <div className="toolbar">
            <Toolbar
              activeTool={activeTool}
              setActiveTool={setActiveTool}
            />
          </div>
          <div className="zoombar">
            <ZoomBar zoom={camera.zoom} zoomTo={zoomTo} />
          </div>
        </div>
      </main>
    </>
  )
}
