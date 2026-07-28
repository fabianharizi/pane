import { useCallback, useEffect, useRef, useState } from "react";

// Owns the right-click menu's open state and decides WHICH menu a click means.
// Rendering lives in ContextMenu.jsx; the contents table lives in contextMenus.js.
//
// The listener goes on the board viewport (same shape as useCamera's wheel
// handler) with a latest-ref so it attaches once yet always sees fresh props.
//
// Nothing here has to coordinate with the tools: usePointer drops non-left
// buttons outright (`e.button !== 0`), so a right-click can't start a marquee,
// move a selection, or commit a draw.

export default function useContextMenu(boardRef, { selectionActive, selectedElements, selectElements, getElement, toWorld }) {
  // { x, y, kind, type, world } | null.
  //   kind  — "canvas" | "single" | "multi", what was right-clicked
  //   type  — element type, single only; picks that type's menu
  //   world — world point under the cursor, for a future "paste here"
  const [contextMenu, setContextMenu] = useState(null);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const latest = useRef(null);
  useEffect(() => { latest.current = { selectionActive, selectedElements, selectElements, getElement, toWorld }; });

  useEffect(() => {
    const board = boardRef.current;

    const handleContextMenu = (e) => {
      e.preventDefault();          // ours, not the browser's
      const { selectionActive, selectedElements, selectElements, getElement, toWorld } = latest.current;

      const uuid = e.target?.closest("[data-uuid]")?.getAttribute("data-uuid") ?? null;

      // A selected element is COVERED by the SelectionBox, which carries no
      // data-uuid — without this the click would read as empty canvas and
      // wipe the very selection the user right-clicked to act on.
      const onChrome = !uuid && !!e.target?.closest("[data-selection-box]");

      const typeOf = (id) => getElement(id)?.type;
      const forSelection = () => selectedElements.length > 1
        ? { kind: "multi" }
        : { kind: "single", type: typeOf(selectedElements[0]) };

      let context;
      if (!selectionActive) {
        // A drawing tool is active, and App deselects on every render while one
        // is. Selecting here would be undone a tick later and leave a "single"
        // menu acting on nothing — so offer the canvas menu and touch nothing.
        context = { kind: "canvas" };
      } else if (uuid && !selectedElements.includes(uuid)) {
        // Right-clicking something unselected selects it first, so the menu
        // and the selection chrome always agree about the target.
        selectElements([uuid]);
        context = { kind: "single", type: typeOf(uuid) };
      } else if (uuid || (onChrome && selectedElements.length)) {
        context = forSelection();
      } else {
        selectElements([]);
        context = { kind: "canvas" };
      }

      setContextMenu({ x: e.clientX, y: e.clientY, ...context, world: toWorld(e.clientX, e.clientY) });
    };

    board.addEventListener("contextmenu", handleContextMenu);
    return () => board.removeEventListener("contextmenu", handleContextMenu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any camera move would leave the menu pointing at the wrong place, so a
  // wheel anywhere dismisses it. Capture phase: useCamera's own wheel handler
  // is non-passive and would otherwise run first.
  useEffect(() => {
    if (!contextMenu) return;
    const onWheel = () => setContextMenu(null);
    window.addEventListener("wheel", onWheel, { capture: true });
    window.addEventListener("blur", onWheel);
    window.addEventListener("resize", onWheel);
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("blur", onWheel);
      window.removeEventListener("resize", onWheel);
    };
  }, [contextMenu]);

  return {
    "contextMenu": contextMenu,
    "closeContextMenu": closeContextMenu
  };
}
