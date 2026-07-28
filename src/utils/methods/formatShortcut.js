// Renders a command's `shortcut` as a display hint: "ctrl+shift+z" → "Ctrl+Shift+Z".
//
// Commands may declare several bindings for one verb (redo is ctrl+shift+z OR
// ctrl+y); a menu has room for one, so this shows the FIRST — the canonical
// binding, which is why the arrays in useCommands.js are ordered that way.
//
// Mirrors the tooltip logic inlined in Toolbar.jsx; when that's next touched it
// should call this instead of keeping a second copy.

export default function formatShortcut(shortcut) {
  const first = [shortcut].flat().filter(Boolean)[0]
  if (!first) return null

  return first
    .split("+")
    .map(part => part === " " ? "Space" : part[0].toUpperCase() + part.slice(1))
    .join("+")
}
