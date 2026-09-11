import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("mobile UI uses direct pointer control and a contact-only power profile", async () => {
  const [html, css, main] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("./style.css", import.meta.url), "utf8"),
    readFile(new URL("./main.js", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(html, /class="dpad"|data-code=/);
  assert.match(html, /id="power"/);
  assert.match(css, /canvas\s*\{[^}]*touch-action:\s*none/s);
  assert.match(main, /addEventListener\("pointerdown"/);
  assert.match(main, /addEventListener\("pointermove"/);
  assert.match(main, /setPointerCapture/);
});
