import { Hand, MousePointer2, Pointer, RectangleHorizontal } from 'lucide-react'
import styles from './Toolbar.module.css'
import { useState } from 'react'

export default function Toolbar(){
  const [selected, setSelected] = useState("select")

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
      {tools.map((group, index) => <div key={"tb-" + index} className={styles.group}>
      {group.map((tool) => <button key={tool.id} className={(tool.id == selected) ? styles.selected : ""} onClick={() => setSelected(tool.id)}><tool.icon /></button>)}
      </div>)}
    </div>
  )
}