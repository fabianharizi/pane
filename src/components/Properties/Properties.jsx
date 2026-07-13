import { useState } from "react"
import styles from "./Properties.module.css"

// Which properties each element type exposes, in display order.
// Only properties the components actually render are listed:
//  - `borderRadius` is ignored by ovals (.oval hardcodes border-radius: 100%)
//  - `headStart`/`headEnd` are stored on lines but never drawn, so they're omitted
//
// Geometry note: elements store two corners (startX, startY, endX, endY) in
// CENTER-RELATIVE coords — (0,0) is the canvas center. Shapes and text expose a
// derived position/size box; lines expose their raw endpoints, because a line's
// direction is meaningful (Line.jsx derives its angle from start→end).
const SCHEMA = {
  rectangle: ["position", "size", "fill", "strokeColor", "strokeWidth", "strokeStyle", "borderRadius", "opacity"],
  oval:      ["position", "size", "fill", "strokeColor", "strokeWidth", "strokeStyle", "opacity"],
  line:      ["start", "end", "strokeColor", "strokeWidth", "strokeStyle"],
  text:      ["position", "size", "content"],
}

// Mirrors the per-component defaults, so an absent property still shows a value.
const DEFAULTS = {
  fill: "#ffffff",
  strokeColor: "#ffffff",
  strokeWidth: 2,
  strokeStyle: "solid",
  borderRadius: 0,
  opacity: 1,
  content: "",
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

// A "pair" field renders two number inputs on one row. Each part derives its value
// from the stored corners (`get`) and returns the corner patch to write (`set`),
// so `position`/`size` stay a single conceptual property in the schema.
const FIELDS = {
  position: {
    label: "Position",
    type: "pair",
    parts: [
      { key: "x", prefix: "X",
        get: (p) => Math.round(Math.min(num(p.startX), num(p.endX))),
        set: (p, v) => ({ startX: v, endX: v + Math.abs(num(p.endX) - num(p.startX)) }) },
      { key: "y", prefix: "Y",
        get: (p) => Math.round(Math.min(num(p.startY), num(p.endY))),
        set: (p, v) => ({ startY: v, endY: v + Math.abs(num(p.endY) - num(p.startY)) }) },
    ],
  },

  size: {
    label: "Size",
    type: "pair",
    parts: [
      { key: "width", prefix: "W", min: 0,
        get: (p) => Math.round(Math.abs(num(p.endX) - num(p.startX))),
        set: (p, v) => {
          const x = Math.min(num(p.startX), num(p.endX))
          return { startX: x, endX: x + v }
        } },
      { key: "height", prefix: "H", min: 0,
        get: (p) => Math.round(Math.abs(num(p.endY) - num(p.startY))),
        set: (p, v) => {
          const y = Math.min(num(p.startY), num(p.endY))
          return { startY: y, endY: y + v }
        } },
    ],
  },

  start: {
    label: "Start",
    type: "pair",
    parts: [
      { key: "startX", prefix: "X", get: (p) => Math.round(num(p.startX)), set: (p, v) => ({ startX: v }) },
      { key: "startY", prefix: "Y", get: (p) => Math.round(num(p.startY)), set: (p, v) => ({ startY: v }) },
    ],
  },

  end: {
    label: "End",
    type: "pair",
    parts: [
      { key: "endX", prefix: "X", get: (p) => Math.round(num(p.endX)), set: (p, v) => ({ endX: v }) },
      { key: "endY", prefix: "Y", get: (p) => Math.round(num(p.endY)), set: (p, v) => ({ endY: v }) },
    ],
  },

  fill:         { label: "Fill",          type: "color", nullable: true },
  strokeColor:  { label: "Stroke",        type: "color", nullable: true },
  strokeWidth:  { label: "Stroke width",  type: "number", min: 0, max: 50,  step: 1 },
  strokeStyle:  { label: "Stroke style",  type: "select", options: ["solid", "dashed", "dotted"] },
  borderRadius: { label: "Corner radius", type: "number", min: 0, max: 500, step: 1 },
  opacity:      { label: "Opacity",       type: "range",  min: 0, max: 1,   step: 0.05 },
  content:      { label: "Text",          type: "textarea" },
}

// "No fill" is stored as the CSS keyword `transparent`, since <input type="color">
// has no empty state. (`none` is not valid for background-color.)
const NONE = "transparent"
const isNone = (value) => !value || value === NONE

// <input type="color"> only understands #rrggbb, but colors are stored with an
// optional alpha suffix (#ffffff88). Strip it to display, restore it on write.
const toHex6 = (value) => (typeof value === "string" && value.startsWith("#") ? value.slice(0, 7) : "#000000")
const withAlpha = (hex6, previous) =>
  typeof previous === "string" && previous.length === 9 ? hex6 + previous.slice(7) : hex6

// A color that can be switched off. The last picked color is remembered locally so
// toggling back on restores it rather than snapping to some default.
function ColorInput({ value, nullable, label, onCommit }) {
  const off = isNone(value)
  const [lastColor, setLastColor] = useState(off ? "#ffffff" : value)

  const handlePick = (e) => {
    const next = withAlpha(e.target.value, off ? lastColor : value)
    setLastColor(next)
    onCommit(next)          // picking a color also switches it back on
  }

  if (!nullable) {
    return <input type="color" className={styles.color} value={toHex6(value)} onChange={handlePick} />
  }

  const noun = label.toLowerCase()

  return (
    <div className={styles.colorField}>
      <input
        type="checkbox"
        className={styles.toggle}
        checked={!off}
        title={off ? `Enable ${noun}` : `Disable ${noun}`}
        onChange={(e) => onCommit(e.target.checked ? lastColor : NONE)}
      />
      <input
        type="color"
        className={off ? `${styles.color} ${styles.colorOff}` : styles.color}
        value={toHex6(off ? lastColor : value)}
        onChange={handlePick}
      />
    </div>
  )
}

const clamp = (n, min, max) => {
  if (min != null) n = Math.max(min, n)
  if (max != null) n = Math.min(max, n)
  return n
}

// A controlled number input can't hold intermediate text like "" or "-", and
// Number("") is 0 — so committing on every keystroke makes negatives untypable
// (typing "-" would immediately write 0). Keep the raw string as a local draft
// while editing, commit only when it parses, and resync to the store on blur.
function NumberInput({ value, min, max, step, className, onCommit }) {
  const [draft, setDraft] = useState(null)

  const handleChange = (e) => {
    const raw = e.target.value
    setDraft(raw)

    if (raw === "" || raw === "-") return   // intermediate: show it, don't commit

    const n = Number(raw)
    if (Number.isFinite(n)) onCommit(clamp(n, min, max))
  }

  return (
    <input
      type="number"
      className={className}
      min={min} max={max} step={step ?? 1}
      value={draft ?? value}
      onChange={handleChange}
      onBlur={() => setDraft(null)}
    />
  )
}

function Field({ name, properties, onPatch }) {
  const field = FIELDS[name]

  // Pair fields own their own read/write per part.
  if (field.type === "pair") {
    return (
      <div className={styles.pair}>
        {field.parts.map((part) => (
          <div key={part.key} className={styles.part}>
            <span className={styles.prefix}>{part.prefix}</span>
            <NumberInput
              min={part.min}
              max={part.max}
              step={part.step}
              value={part.get(properties)}
              onCommit={(n) => onPatch(part.set(properties, n))}
            />
          </div>
        ))}
      </div>
    )
  }

  // Plain fields map 1:1 to a stored property.
  const value = properties[name] ?? DEFAULTS[name]
  const onChange = (v) => onPatch({ [name]: v })

  switch (field.type) {
    case "color":
      return <ColorInput value={value} nullable={field.nullable} label={field.label} onCommit={onChange} />

    case "number":
      return (
        <NumberInput
          className={styles.input}
          min={field.min} max={field.max} step={field.step}
          value={value}
          onCommit={onChange}
        />
      )

    case "range":
      return (
        <div className={styles.range}>
          <input
            type="range"
            min={field.min} max={field.max} step={field.step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className={styles.readout}>{Math.round(value * 100)}%</span>
        </div>
      )

    case "select":
      return (
        <select
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )

    case "textarea":
      return (
        <textarea
          className={styles.textarea}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    default:
      return null
  }
}

export default function Properties({ selectedElements, getElement, updateElements }) {
  // The panel edits exactly one element. Multi-editing needs mixed-value
  // handling (a later feature), so it stays closed for 0 or 2+ selected.
  const element = selectedElements.length === 1 ? getElement(selectedElements[0]) : undefined

  if (!element) return null

  const fields = SCHEMA[element.type] ?? []

  return (
    <aside className={styles.properties}>
      <header className={styles.header}>
        <span className={styles.type}>{element.type}</span>
        <span className={styles.uuid}>{element.uuid}</span>
      </header>

      {/* keyed by uuid so each element gets fresh inputs (no stale NumberInput drafts) */}
      <div className={styles.fields} key={element.uuid}>
        {fields.map((name) => {
          // A <label> may only wrap a single control, so pairs use a plain row.
          const Row = FIELDS[name].type === "pair" ? "div" : "label"

          return (
            <Row key={name} className={styles.field}>
              <span className={styles.label}>{FIELDS[name].label}</span>
              <Field
                name={name}
                properties={element.properties}
                onPatch={(patch) => updateElements([{ uuid: element.uuid, properties: patch }])}
              />
            </Row>
          )
        })}
      </div>
    </aside>
  )
}
