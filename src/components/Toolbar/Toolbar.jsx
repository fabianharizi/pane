import { Hand, MousePointer2, Pointer, RectangleHorizontal } from 'lucide-react'
import styles from './Toolbar.module.css'

export default function Toolbar({activeTool, onToolChange}){
  const tools = [
    [
      {id: "select", icon: MousePointer2},
      {id: "move", icon: Hand}
    ],
    [
      {id: "shape", icon: RectangleHorizontal}
    ]
  ]

  return (
    <div className={styles.toolbar}>
      {tools.map((group, index) => <div key={"tb-"+index} className={styles.group}>
      {group.map((tool) => <button key={"tb-"+tool.id} className={(tool.id === activeTool) ? styles.active : ""} onClick={() => onToolChange(tool.id)}><tool.icon /></button>)}
      </div>)}
    </div>
  )
}