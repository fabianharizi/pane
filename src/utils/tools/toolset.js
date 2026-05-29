import { Circle, Hand, MousePointer2, Slash, Square } from "lucide-react";

const toolset = [
  [
    { id: "select", icon: MousePointer2 },
    { id: "move", icon: Hand }
  ],
  [
    { id: "rectangle", icon: Square },
    { id: "oval", icon: Circle },
    { id: "line", icon: Slash }
  ]
]

export default toolset