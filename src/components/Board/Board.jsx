import styles from './Board.module.css'
import useContent from '../../utils/hooks/useContent'
import SelectionBox from '../SelectionBox/SelectionBox'
import Preview from '../Preview/Preview'

// The board is the camera viewport: it clips, carries the camera CSS variables,
// and receives all pointer/wheel input. The world div inside it is translated
// and scaled by the camera; its children are positioned in world coordinates.

export default function Board({boardRef, content, camera, toWorld, preview, selectedElements, getElement, updateElements, selectionInteractive}){
  const { encodeContent } = useContent([])

  return (
    <div
      className={styles.board}
      ref={boardRef}
      style={{
        '--cam-x': camera.x + 'px',
        '--cam-y': camera.y + 'px',
        '--cam-zoom': camera.zoom,
      }}
    >
      <div className={styles.world}>
        {encodeContent(content)}
        {preview && <Preview {...preview} />}
        {selectedElements.length > 0 && <SelectionBox
          elements={selectedElements.map(getElement).filter(Boolean)}
          zoom={camera.zoom}
          toWorld={toWorld}
          updateElements={updateElements}
          interactive={selectionInteractive}
        />}
      </div>
    </div>
  )
}
