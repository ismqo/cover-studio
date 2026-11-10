import { strict as assert } from "node:assert";
import { test } from "node:test";
import { THIS_IS_INK, thisIsTitleInk, spotifyFontFor, activeBackground, logoCornerFor, allowedLogoCorner, classicTitleYMax, spotifyAlignFor, titleCorner, treatmentChanged, treatmentDefaults, bandLogoArea, bandPhotoRect, bandTitleBox, cornerPosition, fitTitle, fitTitleBlock, logoColor, platformModes, platformOf, spotifyFace, styleDefaults } from "../lib/cover-layout.ts";

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

test("This Is always uses the standard title font; other Spotify styles use the chosen font", () => {
  assert.equal(spotifyFontFor("spotify-this-is", "condensed"), "standard");
  assert.equal(spotifyFontFor("spotify-this-is", "wide"), "standard");
  assert.equal(spotifyFontFor("spotify-band", "wide"), "wide");
  assert.equal(spotifyFontFor("spotify-photo", "condensed"), "condensed");
});

test("Spotify titles use the standard bold face unless the wide or condensed font is chosen", () => {
  assert.deepEqual(spotifyFace("standard"), { weight: 700, family: "CoverFontBold, CoverFont, Arial, sans-serif" });
  assert.deepEqual(spotifyFace("wide"), { weight: 900, family: "CoverFontWide, CoverFontBold, Arial, sans-serif" });
  assert.deepEqual(spotifyFace("condensed"), { weight: 700, family: "CoverFontCondensed, CoverFontBold, Arial, sans-serif" });
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
  const fitted = fitTitleBlock("Hard Rock", "Classics", measure, { ...block, maxHeight: 200, maxLines: 1, subtitleSize: 120 });
  assert.equal(fitted.subtitle?.size, 120);
  assert.ok(fitted.title.size < 100);
  assert.ok(fitted.height <= 200);
});

test("an explicit subtitle gap replaces the default spacing", () => {
  const fitted = fitTitleBlock("Hard Rock", "Classics", measure, { ...block, subtitleSize: 60, gap: 40 });
  assert.equal(fitted.gap, 40);
  assert.equal(fitted.height, 100 + 40 + 60);
});

test("the subtitle gap never shrinks the title; it is capped by the room left", () => {
  const tight = { ...block, maxHeight: 300, subtitleSize: 60 };
  const fitted = fitTitleBlock("Hard Rock", "Classics", measure, { ...tight, gap: 200 });
  assert.deepEqual(fitted.title, fitTitleBlock("Hard Rock", "Classics", measure, { ...tight, gap: 0 }).title);
  assert.equal(fitted.title.size, 100);
  assert.equal(fitted.gap, 140);
  assert.equal(fitted.height, 300);
});

test("the classic title position limit leaves room for the subtitle gap", () => {
  assert.equal(classicTitleYMax(192, 160, 0), 45);
  assert.equal(classicTitleYMax(192, 160, 120), 35);
  assert.equal(classicTitleYMax(216, 180, 400), 15);
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

test("This Is draws its title white only on a black accent (the black swatch or pure black)", () => {
  assert.equal(thisIsTitleInk("#000000"), "#ffffff");
  assert.equal(thisIsTitleInk("#111111"), "#ffffff");
  assert.equal(thisIsTitleInk("#000000".toUpperCase()), "#ffffff");
  assert.equal(thisIsTitleInk("#1e3a8a"), THIS_IS_INK);
  assert.equal(thisIsTitleInk("#222222"), THIS_IS_INK);
  assert.equal(thisIsTitleInk("#e0a988"), THIS_IS_INK);
  assert.equal(thisIsTitleInk("#ffffff"), THIS_IS_INK);
  assert.equal(thisIsTitleInk("#5aa05a"), THIS_IS_INK);
});

test("the logo follows the text color unless Band matches the band color; This Is is always black", () => {
  assert.equal(logoColor("spotify-band", "#111111", "#5aa05a", true), "#5aa05a");
  assert.equal(logoColor("spotify-band", "#111111", "#5aa05a", false), "#111111");
  assert.equal(logoColor("spotify-photo", "#111111", "#5aa05a", true), "#111111");
  assert.equal(logoColor("essentials", "#111111", "#c4c4c4", true), "#111111");
  assert.equal(logoColor("spotify-this-is", "#ffffff", "#e0a988", true), THIS_IS_INK);
  assert.equal(THIS_IS_INK, "#111111");
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

test("Original's title takes the logo corner on its position and alignment side; other styles take none", () => {
  assert.equal(titleCorner("spotify-photo", "top", "left"), "top-left");
  assert.equal(titleCorner("spotify-photo", "bottom", "right"), "bottom-right");
  assert.equal(titleCorner("spotify-band", "bottom", "left"), null);
  assert.equal(titleCorner("classic", "top", "left"), null);
});

test("a logo on the title's corner moves to the other side of the same edge", () => {
  assert.equal(allowedLogoCorner("top-left", "top-left"), "top-right");
  assert.equal(allowedLogoCorner("bottom-right", "bottom-right"), "bottom-left");
  assert.equal(allowedLogoCorner("bottom-left", "top-left"), "bottom-left");
  assert.equal(allowedLogoCorner("top-left", null), "top-left");
});

test("Band aligns its title left on a bottom band and right on a top band; Original keeps the chosen alignment", () => {
  assert.equal(spotifyAlignFor("spotify-band", "bottom", "right"), "left");
  assert.equal(spotifyAlignFor("spotify-band", "top", "left"), "right");
  assert.equal(spotifyAlignFor("spotify-photo", "top", "left"), "left");
  assert.equal(spotifyAlignFor("spotify-photo", "bottom", "right"), "right");
});

test("This Is and Band keep their logo top-left and Essentials only uses top corners; other styles use the chosen corner", () => {
  assert.equal(logoCornerFor("spotify-this-is", "bottom-right"), "top-left");
  assert.equal(logoCornerFor("spotify-band", "bottom-right"), "top-left");
  assert.equal(logoCornerFor("spotify-photo", "bottom-right"), "bottom-right");
  assert.equal(logoCornerFor("classic", "top-right"), "top-right");
  assert.equal(logoCornerFor("classic", "bottom-left"), "bottom-left");
  assert.equal(logoCornerFor("essentials", "bottom-left"), "top-left");
  assert.equal(logoCornerFor("essentials", "bottom-right"), "top-right");
  assert.equal(logoCornerFor("essentials", "top-left"), "top-left");
});

test("Band aligns its title and subtitle to the top of the band, wherever the band sits", () => {
  assert.deepEqual(bandTitleBox(1200, 360, "bottom", 48), { y: 840 + 48, height: 360 - 96, vertical: "top" });
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

test("shades a solid color darker toward the bottom-left and lighter toward the top-right, unless the shadow is off", async () => {
  const { colorShade } = await import("../lib/cover-layout.ts");
  assert.deepEqual(colorShade("#808080"), { dark: "#606060", base: "#808080", light: "#979797" });
  assert.deepEqual(colorShade("#000000"), { dark: "#000000", base: "#000000", light: "#2e2e2e" });
  assert.deepEqual(colorShade("#808080", false), { dark: "#808080", base: "#808080", light: "#808080" });
  assert.deepEqual(colorShade("#ffffff"), { dark: "#bfbfbf", base: "#ffffff", light: "#ffffff" });
});
