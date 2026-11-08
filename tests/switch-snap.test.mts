import { strict as assert } from "node:assert";
import { test } from "node:test";
import { snapSegment } from "../lib/switch-snap.ts";

test("returns to the original option at an exact midpoint", () => {
  assert.equal(snapSegment(0, 0.5, 2), 0);
  assert.equal(snapSegment(1, -0.5, 2), 1);
});

test("snaps to the nearest valid option on either side", () => {
  assert.equal(snapSegment(0, 0.7, 2), 1);
  assert.equal(snapSegment(1, -0.7, 2), 0);
  assert.equal(snapSegment(0, 1.6, 4), 2);
  assert.equal(snapSegment(3, -9, 4), 0);
  assert.equal(snapSegment(0, 9, 4), 3);
});
