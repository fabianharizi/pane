import { Circle, Hand, MousePointer2, Slash, Square } from "lucide-react";

// shortcut: sticky key press that switches to the tool and stays.
// momentary: key that activates the tool only while held, restoring the
//            previous tool on release (e.g. hold Space to temporarily pan).

const toolset = [
  [
    { id: "select", icon: MousePointer2, shortcut: "v" },
    { id: "move", icon: Hand, shortcut: "h", momentary: " " }
  ],
  [
    { id: "rectangle", icon: Square, shortcut: "r" },
    { id: "oval", icon: Circle, shortcut: "o" },
    { id: "line", icon: Slash, shortcut: "l" }
  ]
]

export default toolset
