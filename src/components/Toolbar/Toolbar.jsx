import { Circle, Hand, MousePointer2, Pointer, RectangleHorizontal } from 'lucide-react'
import styles from './Toolbar.module.css'
import { act, useEffect } from 'react';

export default function Toolbar({activeTool, setActiveTool}){
  const tools = [
    [
      {id: "select", icon: MousePointer2},
      {id: "move", icon: Hand}
    ],
    [
      {id: "rectangle", icon: RectangleHorizontal},
      {id: "oval", icon: Circle}
    ]
  ]
  
    useEffect(() => {
      const handleKeyDown = (e) => {
        if(e.key == " "){
          e.preventDefault();
          setActiveTool("move")
        }
      }
      const handleKeyUp = (e) => {
        if(e.key == " "){
          setActiveTool("select")
        }
      }
      
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {window.removeEventListener('keydown', handleKeyDown),
                    window.removeEventListener('keyup', handleKeyUp)};
    }, []);

  return (
    <div className={styles.toolbar}>
      {tools.map((group, index) => <div key={"tb-"+index} className={styles.group}>
      {group.map((tool) => <button key={"tb-"+tool.id} className={(tool.id === activeTool) ? styles.active : ""} onClick={() => setActiveTool(tool.id)}><tool.icon /></button>)}
      </div>)}
    </div>
  )
}