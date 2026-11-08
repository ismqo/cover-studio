import { strict as assert } from "node:assert";
import { test } from "node:test";
import { APPLE_MUSIC_PATH, APPLE_MUSIC_PICKER_PATH, appleLogoShape } from "../lib/apple-logo.ts";

test("the classic Apple Music logo keeps its original path and proportions", () => {
  assert.deepEqual(appleLogoShape("classic"), { path: APPLE_MUSIC_PATH, width: 84.3, height: 20.7 });
});

test("the new Apple Music logo uses the newer wordmark on its 144 × 27 viewBox", () => {
  assert.deepEqual(appleLogoShape("new"), { path: APPLE_MUSIC_PICKER_PATH, width: 144, height: 27 });
});
