import Shape from "../../components/Shape/Shape"
import Line from "../../components/Line/Line"
import Text from "../../components/Text/Text"
import { resolveLineEndpoints } from "./lineGeometry"

// Pure content → JSX (extracted from useContent so any consumer can encode
// without instantiating a second content state). Lines are the one type whose
// stored properties aren't render-ready: bound endpoints resolve here against
// the same content being encoded, so a line follows its targets by construction.
//
// `editing` is the optional in-place edit session — `{ uuid, onChange, onEnd }`
// — handed to the one element it names (text only, today).

export default function encodeContent(content, editing = null) {
  const byId = new Map(content.map(el => [el.uuid, el]))
  const lookup = (uuid) => byId.get(uuid)

  return content.map(el => {
    switch (el.type) {
      case "rectangle":
      case "oval":
        return <Shape
          key={el.uuid}
          uuid={el.uuid}
          selected={el.selected}
          type={el.type}
          properties={el.properties}
        />

      case "line":
        return <Line
          key={el.uuid}
          uuid={el.uuid}
          selected={el.selected}
          properties={{ ...el.properties, ...resolveLineEndpoints(el.properties, lookup) }}
        />

      case "text":
        return <Text
          key={el.uuid}
          uuid={el.uuid}
          selected={el.selected}
          properties={el.properties}
          editing={editing?.uuid === el.uuid ? editing : null}
        />
    }
  })
}
