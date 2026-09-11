import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile UI uses direct finger drag, low retro framing and no strike or arrow buttons", async () => {
  const [html, css, main, pointer, stage, opponent] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("./style.css", import.meta.url), "utf8"),
    readFile(new URL("./main.js", import.meta.url), "utf8"),
    readFile(new URL("./input/pointer.js", import.meta.url), "utf8"),
    readFile(new URL("./render/stage.js", import.meta.url), "utf8"),
    readFile(new URL("./render/opponent.js", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(html, /class="dpad"|data-code=|>\s*SCHLAG\s*<|>\s*HALTEN\s*</);
  assert.doesNotMatch(html, /id="power"/);
  assert.match(html, /id="surge-meter"/);
  assert.match(html, /viewport-fit=cover/);

  assert.match(css, /canvas\s*\{[^}]*touch-action:\s*none/s);
  assert.match(css, /image-rendering:\s*pixelated/);
  assert.match(css, /100dvh/);
  assert.match(css, /Silkscreen/);

  assert.match(pointer, /addEventListener\("pointerdown"/);
  assert.match(pointer, /addEventListener\("pointermove"/);
  assert.match(pointer, /setPointerCapture/);
  assert.match(pointer, /strikerPlane/);
  assert.match(pointer, /new THREE\.Plane\(new THREE\.Vector3\(0, 1, 0\), -\.17\)/);

  assert.match(stage, /setPixelRatio\(1\)/);
  assert.match(stage, /renderScale = aspect < 1 \? \.72 : \.84/);
  assert.match(stage, /basePosition\.set\(0, 10\.2, 23\.5\)/);
  assert.match(main, /visualViewport/);
  assert.doesNotMatch(main, /setPower\(/);

  assert.match(opponent, /THREE\.Sprite/);
  assert.match(opponent, /NearestFilter/);
  assert.match(opponent, /createFrame\("idleA"\)/);
});
