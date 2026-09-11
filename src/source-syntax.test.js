import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const files = [
  "main.js",
  "input/pointer.js",
  "render/stage.js",
  "render/table.js",
  "render/barrier.js",
  "render/opponent.js",
];

test("browser source modules parse as valid JavaScript", () => {
  for (const relative of files) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
    assert.equal(result.status, 0, `${relative} failed syntax check:\n${result.stderr}`);
  }
});
