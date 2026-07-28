import Shape from "../../components/Shape/Shape"
import Line from "../../components/Line/Line"
import Text from "../../components/Text/Text"
import { resolveLineEndpoints } from "./lineGeometry"
import Pane from "../../components/Pane/Pane"

// Pure content → JSX (extracted from useContent so any consumer can encode
// without instantiating a second content state). Lines are the one type whose
// stored properties aren't render-ready: bound endpoints resolve here against
// the same content being encoded, so a line follows its targets by construction.
//
// `selectedElements` is the uuid list from useContent — the single source of
// truth for selection. Elements don't store a `selected` flag; it's derived here
// at render, so nothing can desync (and so a history snapshot is just content).
//
// `editing` is the optional in-place edit session — `{ uuid, onChange, onEnd }`
// — handed to the one element it names (text only, today).

export default function encodeContent(content, selectedElements = [], editing = null) {
  const byId = new Map(content.map(el => [el.uuid, el]))
  const lookup = (uuid) => byId.get(uuid)
  const selected = new Set(selectedElements)

  return content.map(el => {
    switch (el.type) {
      case "rectangle":
      case "oval":
        return <Shape
          key={el.uuid}
          uuid={el.uuid}
          selected={selected.has(el.uuid)}
          type={el.type}
          properties={el.properties}
        />

      case "line":
        return <Line
          key={el.uuid}
          uuid={el.uuid}
          selected={selected.has(el.uuid)}
          properties={{ ...el.properties, ...resolveLineEndpoints(el.properties, lookup) }}
        />

      case "text":
        return <Text
          key={el.uuid}
          uuid={el.uuid}
          selected={selected.has(el.uuid)}
          properties={el.properties}
          editing={editing?.uuid === el.uuid ? editing : null}
        />

      case "pane":
        return <Pane
          key={el.uuid}
          uuid={el.uuid}
          selected={selected.has(el.uuid)}
          properties={el.properties}
          widgetHTML={`
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                margin: 0;
                padding: 16px;
                background: #fafafa;
              }
              h3 {
                margin: 0 0 12px;
                font-size: 14px;
                color: #222;
              }
              .swatches {
                display: flex;
                gap: 6px;
                margin-bottom: 12px;
              }
              .swatch {
                flex: 1;
                height: 60px;
                border-radius: 6px;
                cursor: pointer;
                position: relative;
                border: 1px solid rgba(0,0,0,0.08);
              }
              .swatch:hover::after {
                content: attr(data-hex);
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                color: #555;
                white-space: nowrap;
              }
              button {
                width: 100%;
                padding: 8px;
                border: none;
                background: #222;
                color: #fff;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                margin-top: 14px;
              }
              button:hover {
                background: #000;
              }
              .copied {
                font-size: 11px;
                color: #2a2;
                text-align: center;
                margin-top: 6px;
                height: 14px;
              }
            </style>

            <h3>Color palette generator</h3>
            <div class="swatches" id="swatches"></div>
            <button onclick="generate()">Generate new palette</button>
            <div class="copied" id="copiedMsg"></div>

            <script>
              function randomHex() {
                var letters = '0123456789ABCDEF';
                var hex = '#';
                for (var i = 0; i < 6; i++) {
                  hex += letters[Math.floor(Math.random() * 16)];
                }
                return hex;
              }

              function copyHex(hex) {
                var msg = document.getElementById('copiedMsg');
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(hex);
                }
                msg.textContent = 'Copied ' + hex;
                setTimeout(function () {
                  msg.textContent = '';
                }, 1200);
              }

              function generate() {
                var container = document.getElementById('swatches');
                container.innerHTML = '';
                for (var i = 0; i < 5; i++) {
                  var hex = randomHex();
                  var div = document.createElement('div');
                  div.className = 'swatch';
                  div.style.background = hex;
                  div.setAttribute('data-hex', hex);
                  div.onclick = (function (h) {
                    return function () { copyHex(h); };
                  })(hex);
                  container.appendChild(div);
                }
              }

              generate();
            </script>
            `}
        />
    }
  })
}
