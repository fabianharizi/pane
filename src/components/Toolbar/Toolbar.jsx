import styles from './Toolbar.module.css'
import toolset from '../../utils/tools/toolset.js'
import useShortcuts from '../../utils/hooks/useShortcuts.js'

// Build a tooltip like "Rectangle (R)" from a tool's id and shortcut.
function label(tool){
  const name = tool.id[0].toUpperCase() + tool.id.slice(1);
  if(!tool.shortcut) return name;
  const key = tool.shortcut === " "
    ? "Space" 
    : tool.shortcut.split("+").map(p => p[0].toUpperCase() + p.slice(1)).join("+");
  return `${name} (${key})`;
}

export default function Toolbar({activeTool, setActiveTool}){
  useShortcuts(activeTool, setActiveTool /*, [
    // Non-tool shortcuts. Wire the handlers once content mutation is reachable
    // from here (via props or context). Matching is exact and modifier-aware.
    // { shortcut: "ctrl+z",       handler: undo },
    // { shortcut: "ctrl+shift+z", handler: redo },
    // { shortcut: "delete",       handler: deleteSelected },
  ] */);

  return (
    <div className={styles.toolbar}>
      {toolset.map((group, index) => <div key={"tb-"+index} className={styles.group}>
      {group.map((tool) => <button key={"tb-"+tool.id} title={label(tool)} className={(tool.id === activeTool) ? styles.active : ""} onClick={() => setActiveTool(tool.id)}><tool.icon /></button>)}
      </div>)}
    </div>
  )
}