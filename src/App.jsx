import { useState } from 'react';
import './App.css'
import Board from './components/Board/Board';
import Toolbar from './components/Toolbar/Toolbar';

export default function App(){
  const [activeTool, setActiveTool] = useState("select");

  return (
    <>
      <main className="container">
        <Board 
          activeTool={activeTool}
            setActiveTool={setActiveTool}
        />
        <div className="interface">
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