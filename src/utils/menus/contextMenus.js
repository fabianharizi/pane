import { Layers, Search } from "lucide-react"

// What the right-click menu offers in each situation. Contents only — every
// verb itself is declared once in useCommands.js, and this table just names
// ids, so a menu can never disagree with a shortcut about what a command does.
//
// A menu is an array of SECTIONS; sections render with a divider between them.
// An entry is either:
//    "command-id"                              → one item
//    { label, icon?, items: [...entries] }     → a submenu, nesting freely
//
// Ids that match no command render disabled, so a typo here degrades visibly
// instead of throwing.

const ORDER = {
  label: "Order",
  icon: Layers,
  items: ["bring-front", "bring-forward", "send-backward", "send-back"],
}

// Every single-selection menu today. Peel a type off by giving its key its own
// array — a line will want "Reverse direction", text an "Edit text". Nothing
// outside that one key has to change when one diverges.
const SINGLE = [
  ["cut", "copy", "duplicate"],
  [ORDER],
  ["delete"],
]

export const CONTEXT_MENUS = {
  canvas: [
    ["paste", "paste-here"],
    ["select-all"],
    [{ label: "Zoom", icon: Search, items: ["zoom-in", "zoom-out", "zoom-reset"] }],
    ["undo", "redo"],
  ],

  // Keyed by element type so each can grow its own operations. `default` catches
  // types added later that haven't been given a menu yet — a new element type is
  // never menu-less.
  single: {
    rectangle: SINGLE,
    oval:      SINGLE,
    line:      SINGLE,
    text:      SINGLE,
    default:   SINGLE,
  },

  multi: [
    ["cut", "copy", "duplicate"],
    ["group"],
    [ORDER],
    ["delete"],
  ],
}

// Context descriptor → its section list. `kind` is what was right-clicked;
// `type` narrows a single selection to the element's own menu.
export const menuFor = ({ kind, type }) =>
  kind === "single"
    ? (CONTEXT_MENUS.single[type] ?? CONTEXT_MENUS.single.default)
    : CONTEXT_MENUS[kind]
