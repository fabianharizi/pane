import { useEffect, useRef, useState } from 'react';
import './App.css'
import Board from './components/Board/Board';
import Toolbar from './components/Toolbar/Toolbar';
import Properties from './components/Properties/Properties';
import useContent from './utils/hooks/useContent';
import useBoard from './utils/hooks/useBoard';
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
  const canvasRef = useRef(null);

  const [activeTool, setActiveTool] = useState("select");
  const {content, selectedElement, getElement, addElement, selectElement, updateElement, deleteElement, clearContent} = useContent([]);
  const {boardState, scrollTo, scrollBy} = useBoard(boardRef, canvasRef, content);
  const {preview, enablePreview, disablePreview} = usePreview();
  const clipboard = useRef(null)

  useEffect(() => {
    if (selectedElement && !SELECTION_TOOLS.includes(activeTool)) selectElement(null);
  }, [activeTool, selectedElement]);

  // Install Tool Hooks
  useSelectTool(
    boardRef, 
    activeTool === 'select', 
    selectElement
  )
  useMoveTool(
    boardRef, 
    activeTool === 'move', 
    scrollTo 
  )
  useShapeTool(
    boardRef,
    activeTool === 'rectangle' || activeTool === 'oval',
    activeTool,
    enablePreview,
    disablePreview,
    addElement,
    setActiveTool
  )
  useLineTool(
    boardRef,
    activeTool === 'line',
    enablePreview,
    disablePreview,
    addElement,
    setActiveTool
  )
  useTextTool(
    boardRef, 
    activeTool === 'text',
    enablePreview, 
    disablePreview, 
    addElement,
    setActiveTool
  )

  // Install shortcuts
  useShortcuts(activeTool, setActiveTool, [
    { shortcut: "delete",    handler: () => { if (selectedElement) deleteElement(selectedElement); } },
    { shortcut: "backspace", handler: () => { if (selectedElement) deleteElement(selectedElement); } },
    { shortcut: "ctrl+c",    handler: () => { 
      const el = selectedElement && getElement(selectedElement);
      if (el) clipboard.current = { type: el.type, properties: { ...el.properties } }
      
      }},
    { shortcut: "ctrl+v",    handler: () => { 
      if (clipboard.current) addElement(
        clipboard.current.type, 
        UUID.generate(clipboard.current.type), 
        {
          ...clipboard.current.properties, 
          startX: clipboard.current.properties.startX + 20,
          startY: clipboard.current.properties.startY + 20,
          endX: clipboard.current.properties.endX + 20,
          endY: clipboard.current.properties.endY + 20,
        }) 
      }},
  ]);

  return (
    <>
      <main className="container">
        <Board
          boardRef={boardRef}
          canvasRef={canvasRef}
          content={content}
          boardState={boardState}
          preview={preview}
          selectedElement={selectedElement}
          getElement={getElement}
          updateElement={updateElement}
          selectionInteractive={activeTool === 'select'}
        />
        <div className="interface">
          <div className="properties">
            <Properties
              selectedElement={selectedElement}
              getElement={getElement}
              updateElement={updateElement}
            />
          </div>
          <div className="toolbar">
            <Toolbar 
              activeTool={activeTool}
              setActiveTool={setActiveTool}
            />
          </div>
        </div>
      </main>
    </>
  )
}