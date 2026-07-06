import styles from './Board.module.css'
import useContent from '../../utils/hooks/useContent'

export default function Board({boardRef, canvasRef, content, boardState, preview}){
  const { encodeContent } = useContent([])

  return (
    <div className={styles.board} ref={boardRef}>
      <div className={styles.canvas} ref={canvasRef} style={{ '--canvas-size': boardState.canvasSize + 'px' }}>
        {preview}
        {encodeContent(content, boardState.canvasSize / 2, boardState.canvasSize / 2)}
      </div>
    </div> 
  )
}