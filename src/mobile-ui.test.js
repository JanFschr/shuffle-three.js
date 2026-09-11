import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("portrait UI exposes movement and impulse controls", async () => {
  const [html, css, main] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("./style.css", import.meta.url), "utf8"),
    readFile(new URL("./main.js", import.meta.url), "utf8"),
  ]);

  for (const code of ["KeyW", "KeyA", "KeyS", "KeyD"]) assert.match(html, new RegExp(`data-code="${code}"`));
  assert.match(html, /id="mobile-impulse"/);
  assert.match(css, /orientation:\s*portrait/);
  assert.match(main, /\.move\[data-code\]/);
  assert.match(main, /#mobile-impulse/);
  assert.match(html, /id="pause-toggle"/);
  assert.match(html, /id="resume"/);
  assert.match(main, /pauseButton\.addEventListener\("click",togglePause\)/);
});
