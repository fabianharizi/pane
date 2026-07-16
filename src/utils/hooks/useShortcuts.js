import { useEffect, useRef } from "react";
import toolset from "../tools/toolset";

// This hook wires global keyboard shortcuts.
//
// Tool shortcuts are declared per-tool in toolset.js:
//   - shortcut:  sticky press (switch tool, stays)
//   - momentary: hold to temporarily switch, restore previous tool on release
//
// App commands (delete, copy, zoom, ...) come from the command registry
// (useCommands): [{ id, label, shortcut?, enabled?, run }]. `shortcut` may be
// a string or an array of strings; a command whose `enabled()` is false is
// swallowed (the key is claimed by the app) but not run.
//
// Shortcut strings support modifiers: "ctrl+z", "ctrl+shift+z", "shift+r".
// Matching is EXACT — "r" fires only with no modifiers held, so it won't
// collide with browser combos like Ctrl+R, and those combos fall through
// to the browser untouched.

const tools = toolset.flat();
const momentaryTool = tools.find(t => t.momentary);
const DEFAULT_TOOL = "select";

function parseShortcut(str) {
  const parts = str.toLowerCase().split("+");
  const key = parts.pop();
  return {
    key,
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    meta: parts.includes("meta") || parts.includes("cmd"),
  };
}

function matches(e, combo) {
  return e.key.toLowerCase() === combo.key
    && e.ctrlKey === combo.ctrl
    && e.shiftKey === combo.shift
    && e.altKey === combo.alt
    && e.metaKey === combo.meta;
}

// Tool bindings are static — parse once at module load.
const toolBindings = tools
  .filter(t => t.shortcut)
  .map(t => ({ combo: parseShortcut(t.shortcut), id: t.id }));

export default function useShortcuts(activeTool, setActiveTool, commands = []) {
  const previousTool = useRef(null);

  // Latest-ref so listeners attach once but always see current props.
  const latest = useRef({ activeTool, setActiveTool, commands });
  useEffect(() => { latest.current = { activeTool, setActiveTool, commands }; });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { activeTool, setActiveTool, commands } = latest.current;

      const el = e.target;                                // don't hijack typing
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;

      // Momentary: hold to temporarily switch (e.g. Space to pan). Plain key only.
      if (momentaryTool && e.key === momentaryTool.momentary
          && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();               // suppress default (e.g. Space page-scroll) the whole time it's held
        if (!e.repeat) {                  // but only switch tool on the initial press
          previousTool.current = activeTool;
          setActiveTool(momentaryTool.id);
        }
        return;
      }

      if (e.repeat) return;                               // ignore auto-repeat

      // Commands take priority over tool keys (more specific / modifier combos).
      // A command's shortcut may be a single combo or an array of them.
      const command = commands.find(c =>
        c.shortcut && [c.shortcut].flat().some(s => matches(e, parseShortcut(s)))
      );
      if (command) {
        e.preventDefault();   // the key is the app's even when currently disabled
        if (command.enabled?.() !== false) command.run();
        return;
      }

      const tool = toolBindings.find(b => matches(e, b.combo));
      if (tool) {
        e.preventDefault();
        setActiveTool(tool.id);
      }
    };

    const handleKeyUp = (e) => {
      const { setActiveTool } = latest.current;
      if (momentaryTool && e.key === momentaryTool.momentary) {
        setActiveTool(previousTool.current ?? DEFAULT_TOOL);
        previousTool.current = null;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
}
