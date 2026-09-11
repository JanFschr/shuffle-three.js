import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile UI uses direct drag, dynamic viewport framing and no strike or arrow buttons", async () => {
  const [html, css, main] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("./style.css", import.meta.url), "utf8"),
    readFile(new URL("./main.js", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(html, /class="dpad"|data-code=|>\s*SCHLAG\s*<|>\s*HALTEN\s*</);
  assert.doesNotMatch(html, /id="power"/);
  assert.match(html, /id="surge-meter"/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(css, /canvas\s*\{[^}]*touch-action:\s*none/s);
  assert.match(css, /100dvh/);
  assert.match(main, /addEventListener\("pointerdown"/);
  assert.match(main, /addEventListener\("pointermove"/);
  assert.match(main, /setPointerCapture/);
  assert.match(main, /visualViewport/);
  assert.doesNotMatch(main, /setPower\(/);
});
