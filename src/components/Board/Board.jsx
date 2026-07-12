import styles from './Board.module.css'
import useContent from '../../utils/hooks/useContent'
import SelectionBox from '../SelectionBox/SelectionBox'

export default function Board({boardRef, canvasRef, content, boardState, preview, selectedElement, getElement, updateElement, selectionInteractive}){
  const { encodeContent } = useContent([])

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef} style={{ '--canvas-size': boardState.canvasSize + 'px' }}>
        {encodeContent(content, boardState.canvasSize / 2, boardState.canvasSize / 2)}
        {preview}
        {selectedElement ? <SelectionBox
          element={getElement(selectedElement)}
          center={boardState.canvasSize / 2}
          updateElement={updateElement}
          interactive={selectionInteractive}
        /> : ""}
      </div>
    </div> 
  )
}