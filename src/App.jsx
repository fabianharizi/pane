import './App.css'
import Board from './components/Board/Board';
import Toolbar from './components/Toolbar/Toolbar';

export default function App(){
  return (
    <>
      <main className="container">
        <Board />
        <div className="toolbar">
          <Toolbar />
        </div>
      </main>
    </>
  )
}