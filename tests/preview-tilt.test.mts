import { strict as assert } from "node:assert";
import { test } from "node:test";
import { previewTilt } from "../lib/preview-tilt.ts";

test("tilts with drag distance and clamps rotation", () => {
  assert.deepEqual(previewTilt(0, 0, 200, 200), { x: 0, y: 0 });
  assert.deepEqual(previewTilt(100, -100, 200, 200), { x: 6, y: 6 });
  assert.deepEqual(previewTilt(-1000, 1000, 200, 200), { x: -12, y: -12 });
});
