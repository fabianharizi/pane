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
import useCommands from './utils/hooks/useCommands';

const SELECTION_TOOLS = ['select', 'move'];

export default function App(){
  const boardRef = useRef(null);

  const [activeTool, setActiveTool] = useState("select");
  const {content, selectedElements, getElement, addElements, selectElements, updateElements, deleteElements, clearContent} = useContent([]);
  const {camera, panBy, zoomTo, toWorld} = useCamera(boardRef);
  const {preview, enablePreview, disablePreview} = usePreview();

  // The command registry: every app verb declared once (delete/copy/cut/paste/
  // duplicate/zoom...), consumed by shortcuts, ZoomBar, and future menus.
  const {commands, runCommand} = useCommands({ selectedElements, getElement, addElements, deleteElements, camera, zoomTo });

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

  // Install shortcuts — key bindings come from the registry.
  useShortcuts(activeTool, setActiveTool, commands);

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
            <ZoomBar zoom={camera.zoom} runCommand={runCommand} />
          </div>
        </div>
      </main>
    </>
  )
}
