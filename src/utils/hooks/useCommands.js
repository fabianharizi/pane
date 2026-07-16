import { useRef } from "react";
import UUID from "../methods/UUID";

// The command registry: every app function (verb) declared once as data, so
// each surface — shortcuts, buttons, future menus / context menu / palette —
// binds to the same declaration instead of re-implementing behavior.
//
// A command: { id, label, shortcut?, enabled?, run }
//   - shortcut: string or array of strings ("ctrl+c", ["delete","backspace"]);
//     consumed by useShortcuts with exact modifier matching.
//   - enabled:  optional predicate; falsy result blocks run() everywhere
//     (shortcuts no-op, buttons/menus can gray out).
//
// Commands are verbs (fire-and-forget). Tools are modes and stay in toolset.js;
// a command MAY activate a mode, never the reverse.

export default function useCommands({ selectedElements, getElement, addElements, deleteElements, camera, zoomTo }) {
  // Clipboard is copy/paste-internal state — it lives here, not in App.
  const clipboard = useRef(null);

  const hasSelection = () => selectedElements.length > 0;

  // Type + properties snapshots of the current selection (uuids are minted on spawn).
  const snapshotSelection = () => selectedElements
    .map(getElement)
    .filter(Boolean)
    .map(el => ({ type: el.type, properties: { ...el.properties } }));

  // Materialize snapshots as new elements, offset so they don't cover their
  // sources; addElements selects exactly the spawned set.
  const spawnItems = (items) => {
    addElements(items.map(item => ({
      type: item.type,
      uuid: UUID.generate(item.type.slice(0, 4)),
      properties: {
        ...item.properties,
        startX: item.properties.startX + 20,
        startY: item.properties.startY + 20,
        endX: item.properties.endX + 20,
        endY: item.properties.endY + 20,
      }
    })));
  };

  const commands = [
    {
      id: "delete",
      label: "Delete",
      shortcut: ["delete", "backspace"],
      enabled: hasSelection,
      run: () => deleteElements(selectedElements),
    },
    {
      id: "copy",
      label: "Copy",
      shortcut: "ctrl+c",
      enabled: hasSelection,
      run: () => { clipboard.current = snapshotSelection(); },
    },
    {
      id: "cut",
      label: "Cut",
      shortcut: "ctrl+x",
      enabled: hasSelection,
      run: () => {
        clipboard.current = snapshotSelection();
        deleteElements(selectedElements);
      },
    },
    {
      id: "paste",
      label: "Paste",
      shortcut: "ctrl+v",
      enabled: () => !!clipboard.current?.length,
      run: () => spawnItems(clipboard.current),
    },
    {
      id: "duplicate",
      label: "Duplicate",
      shortcut: "ctrl+d",
      enabled: hasSelection,
      run: () => spawnItems(snapshotSelection()),   // clipboard untouched
    },
    {
      id: "zoom-in",
      label: "Zoom in",
      shortcut: "ctrl+=",
      run: () => zoomTo(camera.zoom * 1.25),
    },
    {
      id: "zoom-out",
      label: "Zoom out",
      shortcut: "ctrl+-",
      run: () => zoomTo(camera.zoom / 1.25),
    },
    {
      id: "zoom-reset",
      label: "Zoom to 100%",
      shortcut: "ctrl+0",
      run: () => zoomTo(1),
    },
  ];

  // For buttons/menus: run a command by id, honoring its enabled predicate.
  const runCommand = (id) => {
    const command = commands.find(c => c.id === id);
    if (!command || command.enabled?.() === false) return;
    command.run();
  };

  return {
    "commands": commands,
    "runCommand": runCommand
  };
}
