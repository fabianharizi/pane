import { useRef } from "react";
import UUID from "../methods/UUID";
import { resolveLineEndpoints } from "../methods/lineGeometry";

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

export default function useCommands({ selectedElements, getElement, addElements, deleteElements, camera, zoomTo, undo, redo, canUndo, canRedo }) {
  // Clipboard is copy/paste-internal state — it lives here, not in App.
  const clipboard = useRef(null);

  const hasSelection = () => selectedElements.length > 0;

  // Type + properties snapshots of the current selection. `source` keeps the
  // copied element's uuid so bindings can be remapped at spawn (fresh uuids are
  // minted then). Line snapshots bake their RESOLVED endpoints and keep a
  // binding only when its target is also in the selection — a line copied
  // without its target pastes detached at its current position, never silently
  // bound to the original.
  const snapshotSelection = () => {
    const selected = new Set(selectedElements);
    return selectedElements
      .map(getElement)
      .filter(Boolean)
      .map(el => {
        if (el.type !== "line") return { type: el.type, source: el.uuid, properties: { ...el.properties } };

        const r = resolveLineEndpoints(el.properties, getElement);
        const keep = (binding) => (binding && selected.has(binding.uuid)) ? binding : null;
        return {
          type: "line",
          source: el.uuid,
          properties: {
            ...el.properties,
            startX: r.startX, startY: r.startY,
            endX: r.endX, endY: r.endY,
            startBinding: keep(el.properties.startBinding),
            endBinding: keep(el.properties.endBinding),
          }
        };
      });
  };

  // Materialize snapshots as new elements, offset so they don't cover their
  // sources; addElements selects exactly the spawned set. Uuids are minted for
  // the whole batch first so kept bindings remap onto the spawned copies.
  const spawnItems = (items) => {
    const minted = new Map(items.map(item => [item.source, UUID.generate(item.type.slice(0, 4))]));
    const remap = (binding) => (binding && minted.has(binding.uuid))
      ? { ...binding, uuid: minted.get(binding.uuid) }
      : null;

    addElements(items.map(item => ({
      type: item.type,
      uuid: minted.get(item.source),
      properties: {
        ...item.properties,
        startX: item.properties.startX + 20,
        startY: item.properties.startY + 20,
        endX: item.properties.endX + 20,
        endY: item.properties.endY + 20,
        ...(item.type === "line" ? {
          startBinding: remap(item.properties.startBinding),
          endBinding: remap(item.properties.endBinding),
        } : {}),
      }
    })));
  };

  const commands = [
    // History first — this is also the order a future menu renders in.
    // useContent coalesces writes, so one drag or typing burst is one step.
    {
      id: "undo",
      label: "Undo",
      shortcut: "ctrl+z",
      enabled: () => canUndo,
      run: undo,
    },
    {
      id: "redo",
      label: "Redo",
      shortcut: ["ctrl+shift+z", "ctrl+y"],
      enabled: () => canRedo,
      run: redo,
    },
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
