import { strict as assert } from "node:assert";
import { test } from "node:test";
import { activeBackground, treatmentChanged, treatmentDefaults, bandLogoArea, bandPhotoRect, bandTitleBox, cornerPosition, fitTitle, fitTitleBlock, logoColor, platformModes, platformOf, spotifyFace, styleDefaults } from "../lib/cover-layout.ts";

// Each character is as wide as the font size, so widths are easy to reason about.
const measure = (value: string, size: number) => value.length * size;

test("keeps a short title on one line at the requested size", () => {
  assert.deepEqual(fitTitle("Noisy", measure, { size: 100, minSize: 20, maxWidth: 600, maxHeight: 200, maxLines: 2, lineHeight: 1 }), { size: 100, lines: ["Noisy"] });
});

test("wraps words onto extra lines before shrinking", () => {
  assert.deepEqual(fitTitle("Hard Rock", measure, { size: 100, minSize: 20, maxWidth: 500, maxHeight: 300, maxLines: 2, lineHeight: 1 }), { size: 100, lines: ["Hard", "Rock"] });
});

test("shrinks when the wrapped lines exceed the line or height limits", () => {
  const fitted = fitTitle("The 5 Indie Scenes", measure, { size: 100, minSize: 10, maxWidth: 600, maxHeight: 150, maxLines: 2, lineHeight: 1 });
  assert.ok(fitted.size < 100);
  assert.ok(fitted.lines.length <= 2);
  assert.ok(fitted.lines.every(line => measure(line, fitted.size) <= 600));
  assert.ok(fitted.lines.length * fitted.size <= 150);
});

test("never shrinks below the minimum size", () => {
  const fitted = fitTitle("Supercalifragilistic", measure, { size: 100, minSize: 40, maxWidth: 100, maxHeight: 100, maxLines: 1, lineHeight: 1 });
  assert.equal(fitted.size, 40);
});

test("maps every cover style to its platform", () => {
  assert.equal(platformOf("classic"), "apple");
  assert.equal(platformOf("essentials"), "apple");
  assert.equal(platformOf("spotify-this-is"), "spotify");
  assert.equal(platformOf("spotify-band"), "spotify");
  assert.equal(platformOf("spotify-photo"), "spotify");
});

test("each Spotify style starts from the look of its reference cover", () => {
  assert.equal(styleDefaults("spotify-band").spotifyTitlePosition, "bottom");
  assert.equal(styleDefaults("spotify-photo").spotifyTitlePosition, "top");
  assert.equal(styleDefaults("spotify-this-is").textColor, "#111111");
});

test("band photo fills the area outside the band when there is no margin", () => {
  assert.deepEqual(bandPhotoRect(1200, 360, "bottom", 0, false), { x: 0, y: 0, width: 1200, height: 840 });
  assert.deepEqual(bandPhotoRect(1200, 360, "top", 0, false), { x: 0, y: 360, width: 1200, height: 840 });
});

test("band photo margin insets the sides and outer edge, and the band edge only when asked", () => {
  // 5% of 1200 = 60px.
  assert.deepEqual(bandPhotoRect(1200, 360, "top", 5, false), { x: 60, y: 360, width: 1080, height: 780 });
  assert.deepEqual(bandPhotoRect(1200, 360, "top", 5, true), { x: 60, y: 420, width: 1080, height: 720 });
  assert.deepEqual(bandPhotoRect(1200, 360, "bottom", 5, true), { x: 60, y: 60, width: 1080, height: 720 });
});

test("Spotify titles use the standard bold face unless the wide font is chosen", () => {
  assert.deepEqual(spotifyFace("standard"), { weight: 700, family: "CoverFontBold, CoverFont, Arial, sans-serif" });
  assert.deepEqual(spotifyFace("wide"), { weight: 900, family: "CoverFontWide, CoverFontBold, Arial, sans-serif" });
});

const block = { size: 100, minSize: 20, maxWidth: 1000, maxHeight: 300, maxLines: 2, lineHeight: 1 };

test("a subtitle is drawn at the requested size under the title", () => {
  const fitted = fitTitleBlock("Hard Rock", "Classics", measure, { ...block, subtitleSize: 60 });
  assert.deepEqual(fitted.title, { size: 100, lines: ["Hard Rock"] });
  assert.deepEqual(fitted.subtitle, { size: 60, lines: ["Classics"] });
  assert.equal(fitted.gap, 15);
  assert.equal(fitted.height, 100 + 15 + 60);
});

test("the title shrinks to leave room for a larger subtitle", () => {
  const fitted = fitTitleBlock("Hard Rock", "Classics", measure, { ...block, maxHeight: 200, maxLines: 1, subtitleSize: 100 });
  assert.equal(fitted.subtitle?.size, 100);
  assert.ok(fitted.title.size < 100);
  assert.ok(fitted.height <= 200);
});

test("an empty subtitle adds no line and no gap", () => {
  const fitted = fitTitleBlock("Noisy", "  ", measure, { ...block, subtitleSize: 60 });
  assert.equal(fitted.subtitle, null);
  assert.equal(fitted.height, 100);
});

test("Original and Full photo each use their own background choice; other styles draw none", () => {
  assert.equal(activeBackground("classic", "gradients", "picture"), "gradients");
  assert.equal(activeBackground("spotify-photo", "gradients", "custom"), "custom");
  assert.equal(activeBackground("spotify-band", "gradients", "colors"), null);
  assert.equal(activeBackground("essentials", "colors", "colors"), null);
});

test("the logo follows the text color unless Band is set to match the band color", () => {
  assert.equal(logoColor("spotify-band", "#111111", "#5aa05a", true), "#5aa05a");
  assert.equal(logoColor("spotify-band", "#111111", "#5aa05a", false), "#111111");
  assert.equal(logoColor("spotify-photo", "#111111", "#5aa05a", true), "#111111");
  assert.equal(logoColor("essentials", "#111111", "#c4c4c4", true), "#111111");
});

const cover = { x: 0, y: 0, width: 1200, height: 1200 };

test("a corner item is placed inside an area with padding from its edges", () => {
  assert.deepEqual(cornerPosition("top-left", 100, 100, cover, 48), { x: 48, y: 48 });
  assert.deepEqual(cornerPosition("bottom-right", 100, 100, { x: 60, y: 60, width: 1080, height: 720 }, 48), { x: 60 + 1080 - 48 - 100, y: 60 + 720 - 48 - 100 });
});

test("Band places the logo relative to a framed photo when it sits on the photo side", () => {
  const photo = bandPhotoRect(1200, 360, "bottom", 5, false);
  assert.deepEqual(bandLogoArea(1200, 360, "bottom", "top-left", 5, false), photo);
  assert.deepEqual(bandLogoArea(1200, 360, "top", "bottom-right", 5, true), bandPhotoRect(1200, 360, "top", 5, true));
});

test("Band keeps the logo relative to the cover on the band side or without a margin", () => {
  assert.deepEqual(bandLogoArea(1200, 360, "bottom", "bottom-left", 5, false), cover);
  assert.deepEqual(bandLogoArea(1200, 360, "bottom", "top-left", 0, false), cover);
});

test("Spotify lists its Original (full photo) style first, so choosing Spotify starts there", () => {
  assert.deepEqual(platformModes.spotify, ["spotify-photo", "spotify-this-is", "spotify-band"]);
});

test("Band anchors its title to the band's outer edge instead of centering it", () => {
  assert.deepEqual(bandTitleBox(1200, 360, "bottom", 48), { y: 840 + 48, height: 360 - 96, vertical: "bottom" });
  assert.deepEqual(bandTitleBox(1200, 360, "top", 48), { y: 48, height: 360 - 96, vertical: "top" });
});

test("photo treatment resets to the style's starting look, including treatment and tint", () => {
  assert.deepEqual(treatmentDefaults("essentials"), { treatment: "original", tint: "#e8e8ed", brightness: 0, contrast: 0 });
  assert.deepEqual(treatmentDefaults("spotify-photo"), { treatment: "mono", tint: "#e8e8ed", brightness: 0, contrast: 0 });
});

test("the photo treatment reset is enabled when any treatment setting differs", () => {
  const base = { treatment: "original", tint: "#e8e8ed", brightness: 0, contrast: 0 } as const;
  assert.equal(treatmentChanged("essentials", base), false);
  assert.equal(treatmentChanged("essentials", { ...base, treatment: "mono" }), true);
  assert.equal(treatmentChanged("essentials", { ...base, tint: "#ffffff" }), true);
  assert.equal(treatmentChanged("essentials", { ...base, brightness: 10 }), true);
});

test("shades a solid color darker toward the bottom-left and lighter toward the top-right", async () => {
  const { colorShade } = await import("../lib/cover-layout.ts");
  assert.deepEqual(colorShade("#808080"), { dark: "#606060", base: "#808080", light: "#979797" });
  assert.deepEqual(colorShade("#000000"), { dark: "#000000", base: "#000000", light: "#2e2e2e" });
  assert.deepEqual(colorShade("#ffffff"), { dark: "#bfbfbf", base: "#ffffff", light: "#ffffff" });
});
