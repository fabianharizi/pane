import styles from './Toolbar.module.css'
import { useEffect } from 'react';
import toolset from '../../utils/tools/toolset.js'

export default function Toolbar({activeTool, setActiveTool}){
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
      {toolset.map((group, index) => <div key={"tb-"+index} className={styles.group}>
      {group.map((tool) => <button key={"tb-"+tool.id} className={(tool.id === activeTool) ? styles.active : ""} onClick={() => setActiveTool(tool.id)}><tool.icon /></button>)}
      </div>)}
    </div>
  )
}