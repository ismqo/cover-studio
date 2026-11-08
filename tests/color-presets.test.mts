import { strict as assert } from "node:assert";
import { test } from "node:test";
import { BASIC_COLORS, findPreset } from "../lib/color-presets.ts";

test("the basic palette has the macOS accent colors plus white and black", () => {
  assert.deepEqual(BASIC_COLORS.map(([name]) => name), ["blue", "purple", "pink", "red", "orange", "yellow", "green", "graphite", "white", "black"]);
});

test("a value matching a preset selects it, ignoring hex letter case", () => {
  assert.equal(findPreset("#FFFFFF", BASIC_COLORS.map(([, hex]) => hex)), "#ffffff");
});

test("a value outside the presets selects the custom color", () => {
  assert.equal(findPreset("#123456", BASIC_COLORS.map(([, hex]) => hex)), null);
});
