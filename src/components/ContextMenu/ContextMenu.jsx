import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ChevronRight } from "lucide-react"
import styles from "./ContextMenu.module.css"
import { menuFor } from "../../utils/menus/contextMenus"
import formatShortcut from "../../utils/methods/formatShortcut"

// The right-click menu. Dumb by design: it renders whatever the command
// registry declares (label, shortcut hint, enabled) and dispatches by id — it
// holds no behavior of its own. `useContextMenu` decides when and where it
// opens; `contextMenus.js` decides what's in it.
//
// Panels are recursive — a submenu is this same component one level down — so
// nesting depth costs nothing.

// Keep panels this far off the viewport edge.
const MARGIN = 8

// Hover dwell before a submenu opens or closes. The CLOSING delay is the
// important one: a diagonal path from a parent item to its child panel clips a
// sibling row, and without the delay that dismisses the thing being reached for.
const HOVER_MS = 120

// Panels are `position: fixed`, so these are viewport coords — the same space
// the contextmenu event reports and the board is measured in.
//
// A panel renders hidden for one pass, measures itself, then places itself:
// `x`/`y` if it fits, otherwise flipped to `flipX`/`flipY` (the cursor's or the
// parent item's other side). One frame of a menu in the wrong corner is very
// visible, so the correction happens in useLayoutEffect, before paint.
function usePlacement(ref, want) {
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()

    const fitsRight = want.x + width <= window.innerWidth - MARGIN
    const fitsBelow = want.y + height <= window.innerHeight - MARGIN

    const clamp = (v, size, limit) => Math.max(MARGIN, Math.min(v, limit - size - MARGIN))

    setPos({
      x: clamp(fitsRight ? want.x : want.flipX - width, width, window.innerWidth),
      y: clamp(fitsBelow ? want.y : want.flipY - height, height, window.innerHeight),
    })
  }, [ref, want.x, want.y, want.flipX, want.flipY])

  return pos
}

// One panel. `sections` is an array of arrays; a divider separates each pair.
function MenuPanel({ sections, byId, onChoose, onDismiss, want, autoFocus }) {
  const ref = useRef(null)
  const pos = usePlacement(ref, want)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  // Roving focus among this panel's OWN enabled items. The containment filter
  // matters: an open submenu is a DOM descendant, and without it Arrow keys
  // would walk into the child panel's rows.
  const focusStep = (dir) => {
    const items = [...ref.current.querySelectorAll('[role="menuitem"]')]
      .filter(el => el.closest('[role="menu"]') === ref.current && !el.disabled)
    if (!items.length) return
    const at = items.indexOf(document.activeElement)
    items[(at + dir + items.length) % items.length].focus()
  }

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      e.stopPropagation()          // deepest panel wins
      focusStep(e.key === "ArrowDown" ? 1 : -1)
    } else if (e.key === "Escape" || e.key === "ArrowLeft") {
      e.stopPropagation()
      onDismiss()
    }
  }

  return (
    <ul
      className={styles.panel}
      ref={ref}
      role="menu"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{
        left: (pos?.x ?? want.x) + "px",
        top: (pos?.y ?? want.y) + "px",
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {sections.map((section, s) => (
        <Fragment key={s}>
          {s > 0 && <li role="separator" className={styles.divider} />}
          {section.map((entry, i) => (
            typeof entry === "object"
              ? <SubmenuRow key={i} entry={entry} byId={byId} onChoose={onChoose} />
              : <CommandRow key={i} id={entry} byId={byId} onChoose={onChoose} />
          ))}
        </Fragment>
      ))}
    </ul>
  )
}

// A leaf item. An unknown id — or one whose enabled() says no — still renders,
// greyed rather than hidden, so a menu's shape stays predictable and a typo in
// the contents table degrades visibly instead of vanishing.
function CommandRow({ id, byId, onChoose }) {
  const command = byId.get(id)
  const disabled = !command || command.enabled?.() === false
  const hint = command && formatShortcut(command.shortcut)

  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        className={id === "delete" ? `${styles.item} ${styles.danger}` : styles.item}
        disabled={disabled}
        onClick={() => onChoose(id)}
      >
        <span className={styles.label}>{command?.label ?? id}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </button>
    </li>
  )
}

// A submenu trigger plus its panel. Open/close hangs off the ROW, not the
// button: the child panel is a DOM descendant of this <li>, so pointerleave
// won't fire while the pointer is inside the submenu — which is exactly the
// behavior wanted, for free.
function SubmenuRow({ entry, byId, onChoose }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const button = useRef(null)
  const timer = useRef(null)
  const Icon = entry.icon

  const dwell = (fn) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(fn, HOVER_MS)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  // Measure at open time so the panel tracks a parent that was itself flipped
  // or clamped — no need to thread the parent's final position down.
  useLayoutEffect(() => {
    if (open) setRect(button.current?.getBoundingClientRect() ?? null)
  }, [open])

  return (
    <li
      role="none"
      onPointerEnter={() => dwell(() => setOpen(true))}
      onPointerLeave={() => dwell(() => setOpen(false))}
    >
      <button
        type="button"
        ref={button}
        role="menuitem"
        className={styles.item}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            setOpen(true)
          }
        }}
      >
        {Icon && <Icon size={14} className={styles.icon} />}
        <span className={styles.label}>{entry.label}</span>
        <ChevronRight size={13} className={styles.chevron} />
      </button>

      {open && rect && <MenuPanel
        sections={[entry.items]}
        byId={byId}
        onChoose={onChoose}
        onDismiss={() => { setOpen(false); button.current?.focus() }}
        autoFocus
        want={{
          // Overlap the parent's border by a pixel so the pointer never has a
          // gap to fall through on the way across.
          x: rect.right - 1,
          y: rect.top - 4,
          flipX: rect.left + 1,
          flipY: rect.bottom + 4,
        }}
      />}
    </li>
  )
}

export default function ContextMenu({ menu, commands, runCommand, onClose }) {
  const root = useRef(null)

  // Dismissal: pointerdown rather than click, so the menu is gone before the
  // board's own gesture starts, and no listeners at all while closed.
  //
  // CAPTURE phase is load-bearing. usePointer stops propagation on every
  // pointerdown it handles, so a press on the board never reaches document by
  // bubbling — a bubble-phase listener here would only ever see clicks that
  // land on the surrounding UI panels, and clicking the canvas would leave the
  // menu stuck open. Capture runs document → target, ahead of that.
  useEffect(() => {
    if (!menu) return
    const onPress = (e) => { if (!root.current?.contains(e.target)) onClose() }
    const onKey = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("pointerdown", onPress, true)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPress, true)
      document.removeEventListener("keydown", onKey)
    }
  }, [menu, onClose])

  if (!menu) return null

  const sections = menuFor(menu)
  if (!sections) return null

  return (
    // `display: contents` — the wrapper exists only so outside-click can test
    // containment across every panel. It must not become a box: `.interface *`
    // would give a full-bleed one pointer-events and swallow the canvas.
    <div className={styles.root} ref={root}>
      <MenuPanel
        sections={sections}
        byId={new Map(commands.map(c => [c.id, c]))}
        onChoose={(id) => { runCommand(id); onClose() }}   // runCommand honors `enabled`
        onDismiss={onClose}
        autoFocus
        want={{ x: menu.x, y: menu.y, flipX: menu.x, flipY: menu.y }}
      />
    </div>
  )
}
