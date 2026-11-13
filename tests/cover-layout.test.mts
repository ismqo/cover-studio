import { strict as assert } from "node:assert";
import { test } from "node:test";
import { artistBubbles, artistLookAt, DEFAULT_ARTIST_LOOK, treatmentDiffers, colorGradientStops, diamondPosition, GRADIENT_TYPES, CLASSIC_LINE_HEIGHT, essentialsTitleBlock, titleLines, THIS_IS_INK, thisIsTitleInk, spotifyFontFor, activeBackground, logoCornerFor, allowedLogoCorner, classicTitleYMax, spotifyAlignFor, titleCorner, treatmentChanged, treatmentDefaults, bandLogoArea, bandPhotoRect, bandTitleBox, cornerPosition, fitTitle, fitTitleBlock, logoColor, platformModes, platformOf, spotifyFace, styleDefaults, dailyMixDesignDefaults, dailyMixHeading, dailyMixNumberLabel, dailyMixLabels, parseMixNumber, DAILY_MIX_WAVE, dailyMixNumberFace, spotifyFonts, SPOTIFY_LOGO, dailyMixTitleBox, DAILY_MIX_NUMBER_SIZE, essentialsDesignDefaults, essentialsClassicLayout, ESSENTIALS_CLASSIC } from "../lib/cover-layout.ts";

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
  assert.deepEqual(platformModes.spotify, ["spotify-photo", "spotify-this-is", "spotify-band", "spotify-daily-mix"]);
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

test("This Is and Band keep their logo top-left and Essentials always uses top-right; other styles use the chosen corner", () => {
  assert.equal(logoCornerFor("spotify-this-is", "bottom-right"), "top-left");
  assert.equal(logoCornerFor("spotify-band", "bottom-right"), "top-left");
  assert.equal(logoCornerFor("spotify-photo", "bottom-right"), "bottom-right");
  assert.equal(logoCornerFor("classic", "top-right"), "top-right");
  assert.equal(logoCornerFor("classic", "bottom-left"), "bottom-left");
  assert.equal(logoCornerFor("essentials", "bottom-left"), "top-right");
  assert.equal(logoCornerFor("essentials", "bottom-right"), "top-right");
  assert.equal(logoCornerFor("essentials", "top-left"), "top-right");
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

test("a manual line break starts a new title line even when the words would fit on one", () => {
  assert.deepEqual(fitTitle("Hard\nRock", measure, { size: 100, minSize: 20, maxWidth: 1000, maxHeight: 300, maxLines: 2, lineHeight: 1 }), { size: 100, lines: ["Hard", "Rock"] });
});

test("long lines between manual breaks still wrap on words", () => {
  assert.deepEqual(fitTitle("Indie Rock\nNow", measure, { size: 100, minSize: 20, maxWidth: 500, maxHeight: 300, maxLines: 3, lineHeight: 1 }), { size: 100, lines: ["Indie", "Rock", "Now"] });
});

test("manual breaks beyond the line limit join the last line instead of dropping words", () => {
  assert.deepEqual(titleLines("A\nB\nC", 2), ["A", "B C"]);
  assert.deepEqual(fitTitle("A\nB\nC", measure, { size: 100, minSize: 20, maxWidth: 1000, maxHeight: 300, maxLines: 2, lineHeight: 1 }), { size: 100, lines: ["A", "B C"] });
});

test("outer line breaks and spaces are ignored", () => {
  assert.deepEqual(titleLines("\n  Noisy \n"), ["Noisy"]);
  assert.deepEqual(titleLines("Hard\r\nRock"), ["Hard", "Rock"]);
});

test("each extra classic title line raises the position limit by one line", () => {
  assert.equal(classicTitleYMax(192, 160, 0, 1), 45);
  assert.equal(classicTitleYMax(100, 60, 0, 2), Math.max(15, Math.floor((900 - 100 - 100 * CLASSIC_LINE_HEIGHT - 60) / 12)));
});

test("a one-line Essentials title keeps its position and the band height", () => {
  assert.deepEqual(essentialsTitleBlock(324, 100, 1), { y: 204, band: 324 });
  assert.deepEqual(essentialsTitleBlock(100, 100, 1), { y: 28, band: 100 });
});

test("extra Essentials title lines grow upward, then grow the band once they reach the top", () => {
  assert.deepEqual(essentialsTitleBlock(500, 100, 2), { y: 380 - 100 * CLASSIC_LINE_HEIGHT, band: 500 });
  const tall = essentialsTitleBlock(324, 100, 3);
  assert.equal(tall.y, 28);
  assert.equal(tall.band, 28 + 100 + 2 * 100 * CLASSIC_LINE_HEIGHT + 20);
});

// Monospaced stand-in: every character is 0.618em wide, like SF Mono.
const mono = (value: string, size: number) => [...value].length * size * .618;

test("Essentials designs set their own colors; only the new design has a title size, the classic one draws its title at a fixed size", () => {
  assert.deepEqual(essentialsDesignDefaults("classic"), { essentialsDesign: "classic", textColor: "#111111", bandColor: "#e6e6e6" });
  assert.equal(ESSENTIALS_CLASSIC.size, 152);
  assert.deepEqual(essentialsDesignDefaults("new"), { essentialsDesign: "new", textColor: "#111111", bandColor: "#c4c4c4", essentialsFontSize: 136 });
});

test("the classic Essentials title spans the cover at its default size, over a band just tall enough for it", () => {
  const layout = essentialsClassicLayout(["ESSENTIALS"], "", ESSENTIALS_CLASSIC.size, mono);
  assert.equal(layout.size, 152);
  const width = mono("ESSENTIALS", 152) + 9 * ESSENTIALS_CLASSIC.tracking * 152;
  assert.ok(width <= ESSENTIALS_CLASSIC.maxWidth && width > ESSENTIALS_CLASSIC.maxWidth - 20, `title spans ${width}px`);
  assert.equal(layout.subtitle, null);
  // Equal-ish air above and below the capitals: the band ends just under the title.
  const [line] = layout.lines;
  assert.equal(line.baseline, Math.round(152 * (ESSENTIALS_CLASSIC.top + ESSENTIALS_CLASSIC.capHeight)));
  assert.equal(layout.band, Math.round(line.baseline + 152 * ESSENTIALS_CLASSIC.bottom));
});

test("a classic Essentials title too wide for the cover shrinks until it fits", () => {
  const layout = essentialsClassicLayout(["IMPRESCINDIBLES"], "", 152, mono);
  assert.ok(layout.size < 152);
  const width = (size: number) => mono("IMPRESCINDIBLES", size) + 14 * ESSENTIALS_CLASSIC.tracking * size;
  assert.ok(width(layout.size) <= ESSENTIALS_CLASSIC.maxWidth);
  assert.ok(width(layout.size + 1) > ESSENTIALS_CLASSIC.maxWidth);
});

test("a classic Essentials subtitle sits under the title and makes the band taller", () => {
  const plain = essentialsClassicLayout(["ESSENTIALS"], "", ESSENTIALS_CLASSIC.size, mono);
  const withSubtitle = essentialsClassicLayout(["ESSENTIALS"], "SURF", 152, mono);
  assert.ok(withSubtitle.subtitle);
  assert.equal(withSubtitle.subtitle.text, "SURF");
  assert.equal(withSubtitle.subtitle.size, Math.round(152 * ESSENTIALS_CLASSIC.subtitleScale));
  assert.ok(withSubtitle.subtitle.baseline > withSubtitle.lines[0].baseline + withSubtitle.subtitle.size * ESSENTIALS_CLASSIC.capHeight);
  assert.ok(withSubtitle.band > plain.band);
  // A blank subtitle is no subtitle.
  assert.equal(essentialsClassicLayout(["ESSENTIALS"], "   ", 152, mono).subtitle, null);
});

test("each extra classic Essentials title line adds one line pitch to the band", () => {
  const one = essentialsClassicLayout(["ROCK"], "", 152, mono);
  const two = essentialsClassicLayout(["ROCK", "ROLL"], "", 152, mono);
  assert.equal(two.lines[1].baseline - two.lines[0].baseline, Math.round(152 * CLASSIC_LINE_HEIGHT));
  assert.equal(two.band - one.band, Math.round(152 * CLASSIC_LINE_HEIGHT));
});

test("Apple Music lists Similar Artist Radio after Essentials", () => {
  assert.deepEqual(platformModes.apple, ["classic", "essentials", "similar-artists"]);
  assert.equal(platformOf("similar-artists"), "apple");
});

test("Similar Artist Radio starts with a mono main artist, white logo, and a dark solid background", () => {
  const style = styleDefaults("similar-artists");
  assert.equal(style.treatment, "mono");
  assert.equal(style.textColor, "#ffffff");
  assert.equal(style.corner, "top-right");
});

test("Similar Artist Radio always keeps the logo top-right", () => {
  assert.equal(logoCornerFor("similar-artists", "bottom-left"), "top-right");
  assert.equal(logoCornerFor("similar-artists", "top-left"), "top-right");
});

test("Similar Artist Radio reuses Original's gradient and color backgrounds, but has no picture background", () => {
  assert.equal(activeBackground("similar-artists", "gradients", "picture"), "gradients");
  assert.equal(activeBackground("similar-artists", "custom", "picture"), "custom");
  assert.equal(activeBackground("similar-artists", "picture", "gradients"), "custom");
});

test("one artist is a single centered bubble", () => {
  assert.deepEqual(artistBubbles(1), [{ x: 600, y: 600, r: 440 }]);
});

test("a second artist overlaps the main bubble's top-left edge, a third its bottom-right edge", () => {
  assert.deepEqual(artistBubbles(2), [{ x: 600, y: 600, r: 440 }, { x: 281, y: 296, r: 157 }]);
  assert.deepEqual(artistBubbles(3), [{ x: 600, y: 600, r: 440 }, { x: 281, y: 296, r: 157 }, { x: 906, y: 913, r: 157 }]);
});

test("small bubbles stay inside the cover", () => {
  for (const { x, y, r } of artistBubbles(3)) {
    assert.ok(x - r >= 0 && y - r >= 0 && x + r <= 1200 && y + r <= 1200);
  }
});

const shade = { dark: "#000000", base: "#808080", light: "#ffffff" };

test("the color background offers linear, radial, diamond, and reflected gradients", () => {
  assert.deepEqual(GRADIENT_TYPES, ["linear", "radial", "diamond", "reflected"]);
});

test("linear and diamond gradients run from the dark shade through the base color to the light shade", () => {
  for (const type of ["linear", "diamond"] as const) {
    assert.deepEqual(colorGradientStops(type, shade), [[0, "#000000"], [.5, "#808080"], [1, "#ffffff"]]);
  }
});

test("a radial gradient glows light in the center and darkens toward the edges", () => {
  assert.deepEqual(colorGradientStops("radial", shade), [[0, "#ffffff"], [.5, "#808080"], [1, "#000000"]]);
});

test("a reflected gradient mirrors the linear one: dark at both ends, light in the middle", () => {
  assert.deepEqual(colorGradientStops("reflected", shade), [[0, "#000000"], [.25, "#808080"], [.5, "#ffffff"], [.75, "#808080"], [1, "#000000"]]);
});

test("a diamond gradient is dark at the center and light at the corners, with equal values along each diamond", () => {
  assert.equal(diamondPosition(600, 600, 1200), 0);
  assert.equal(diamondPosition(0, 0, 1200), 1);
  assert.equal(diamondPosition(1200, 600, 1200), .5);
  assert.equal(diamondPosition(900, 900, 1200), diamondPosition(600, 1200, 1200));
});

test("artists 2 and 3 start with an untouched crop and the original photo treatment", () => {
  assert.deepEqual(DEFAULT_ARTIST_LOOK, { zoom: 1, offsetX: 50, offsetY: 50, treatment: "original", tint: "#e8e8ed", brightness: 0, contrast: 0 });
  assert.deepEqual(artistLookAt([], 0), DEFAULT_ARTIST_LOOK);
});

test("an artist's own treatment and crop override the defaults, and missing fields fall back to them", () => {
  const look = artistLookAt([{ ...DEFAULT_ARTIST_LOOK, treatment: "duotone", tint: "#efa1ad", brightness: 20 }, { zoom: 2, offsetX: 10, offsetY: 90 } as never], 0);
  assert.deepEqual(look, { ...DEFAULT_ARTIST_LOOK, treatment: "duotone", tint: "#efa1ad", brightness: 20 });
  assert.deepEqual(artistLookAt([DEFAULT_ARTIST_LOOK, { zoom: 2, offsetX: 10, offsetY: 90 } as never], 1), { ...DEFAULT_ARTIST_LOOK, zoom: 2, offsetX: 10, offsetY: 90 });
});

test("an artist's treatment counts as changed only when it differs from its own starting look", () => {
  assert.equal(treatmentDiffers(DEFAULT_ARTIST_LOOK, DEFAULT_ARTIST_LOOK), false);
  assert.equal(treatmentDiffers(DEFAULT_ARTIST_LOOK, { ...DEFAULT_ARTIST_LOOK, contrast: 5 }), true);
  assert.equal(treatmentDiffers(DEFAULT_ARTIST_LOOK, { ...DEFAULT_ARTIST_LOOK, tint: "#E8E8ED" }), false);
});

test("Spotify lists Daily Mix after Band", () => {
  assert.equal(platformModes.spotify.at(-1), "spotify-daily-mix");
  assert.equal(platformOf("spotify-daily-mix"), "spotify");
});

test("Daily Mix starts with the classic design: a color photo on pink, with near-black text and logo", () => {
  const style = styleDefaults("spotify-daily-mix");
  assert.equal(style.dailyMixDesign, "classic");
  assert.equal(style.corner, "top-left");
  assert.equal(style.textColor, "#111111");
  assert.equal(style.bandColor, "#f06e94");
  assert.equal(style.treatment, "original");
});

test("Daily Mix's new design starts with a mono photo, cyan labels and logo, and near-black label text", () => {
  assert.deepEqual(dailyMixDesignDefaults("new"), { dailyMixDesign: "new", textColor: "#111111", bandColor: "#1ed7f0", treatment: "mono", dailyMixFontSize: 112 });
  assert.deepEqual(dailyMixDesignDefaults("classic"), { dailyMixDesign: "classic", textColor: "#111111", bandColor: "#f06e94", treatment: "original", dailyMixFontSize: 120 });
});

test("Daily Mix's photo treatment starts from its design's treatment", () => {
  assert.equal(treatmentDefaults("spotify-daily-mix", "classic").treatment, "original");
  assert.equal(treatmentDefaults("spotify-daily-mix", "new").treatment, "mono");
  // Other styles ignore the design.
  assert.equal(treatmentDefaults("spotify-photo", "classic").treatment, "mono");
});

test("Daily Mix pins the logo top-left, uses the chosen title font, and has no background choice or title corner", () => {
  assert.equal(logoCornerFor("spotify-daily-mix", "bottom-right"), "top-left");
  assert.equal(spotifyFontFor("spotify-daily-mix", "wide"), "wide");
  assert.equal(spotifyFontFor("spotify-daily-mix", "standard"), "standard");
  assert.equal(activeBackground("spotify-daily-mix", "gradients", "picture"), null);
  assert.equal(titleCorner("spotify-daily-mix", "bottom", "left"), null);
});

test("Daily Mix's logo follows the text color in the classic design and the label color in the new design", () => {
  assert.equal(logoColor("spotify-daily-mix", "#111111", "#1ed7f0", false, "classic"), "#111111");
  assert.equal(logoColor("spotify-daily-mix", "#111111", "#1ed7f0", false, "new"), "#1ed7f0");
  // The design only matters for Daily Mix.
  assert.equal(logoColor("spotify-photo", "#111111", "#1ed7f0", false, "new"), "#111111");
});

test("the mix number field accepts whole numbers from 1 to 99, clamping out-of-range ones and ignoring anything else", () => {
  assert.equal(parseMixNumber("4"), 4);
  assert.equal(parseMixNumber(" 12 "), 12);
  assert.equal(parseMixNumber("0"), 1);
  assert.equal(parseMixNumber("-3"), 1);
  assert.equal(parseMixNumber("250"), 99);
  assert.equal(parseMixNumber(""), null);
  assert.equal(parseMixNumber("2.5"), null);
  assert.equal(parseMixNumber("abc"), null);
});

test("the classic Daily Mix heading follows the title with the mix number; the new design zero-pads the number", () => {
  assert.equal(dailyMixHeading("Daily Mix", 4), "Daily Mix 4");
  assert.equal(dailyMixHeading("  Daily Mix  ", 4), "Daily Mix 4");
  assert.equal(dailyMixHeading("", 4), "4");
  // A line break in the title is kept; the number follows the last line.
  assert.equal(dailyMixHeading("My\nDaily Mix", 4), "My\nDaily Mix 4");
  // With the number hidden, the heading is the title alone.
  assert.equal(dailyMixHeading("  Daily Mix  ", null), "Daily Mix");
  assert.equal(dailyMixNumberLabel(1), "01");
  assert.equal(dailyMixNumberLabel(6), "06");
});

test("new Daily Mix labels hug their text: the title at the bottom-left and the number at the bottom-right, on a shared bottom edge", () => {
  const { titles: [title], number } = dailyMixLabels(1200, 40, [{ width: 400, ascent: 80, font: 100 }], { width: 200, ascent: 130, font: 180 });
  assert.equal(title.x, 40);
  assert.equal(number.x + number.width, 1160);
  assert.equal(title.y + title.height, 1160);
  assert.equal(number.y + number.height, 1160);
  // Padding scales with the font size, and the text sits inside its box.
  assert.equal(title.width, 400 + 100 * .16 * 2);
  assert.equal(number.width, 200 + 180 * .16 * 2);
  assert.equal(title.textX, 40 + 16);
  assert.ok(title.baseline - 80 > title.y && title.baseline < title.y + title.height);
  assert.ok(number.baseline - 130 > number.y && number.baseline < number.y + number.height);
});

test("a two-line new Daily Mix title stacks one label per line, the last line at the bottom, with equal heights", () => {
  const { titles: [first, last] } = dailyMixLabels(1200, 40, [{ width: 300, ascent: 70, font: 100 }, { width: 500, ascent: 80, font: 100 }], { width: 200, ascent: 130, font: 180 });
  assert.equal(last.y + last.height, 1160);
  assert.equal(first.y + first.height, last.y);
  assert.equal(first.x, 40);
  assert.equal(last.x, 40);
  assert.equal(first.height, last.height);
  assert.equal(first.width, 300 + 32);
  assert.equal(last.width, 500 + 32);
});

test("with the number hidden, the new Daily Mix has no number label and the title labels stay bottom-left", () => {
  const { titles: [title], number } = dailyMixLabels(1200, 40, [{ width: 400, ascent: 80, font: 100 }], null);
  assert.equal(number, null);
  assert.equal(title.x, 40);
  assert.equal(title.y + title.height, 1160);
});

test("the classic Daily Mix wave is smooth: few curves, no kinks where they meet, and none doubling back", () => {
  const curves = [...DAILY_MIX_WAVE.matchAll(/C([^CLZ]+)/g)].map(m => m[1].trim().split(/\s+/).map(Number));
  // Each curve: [c1x, c1y, c2x, c2y, x, y], starting where the previous command ended.
  const starts = [...DAILY_MIX_WAVE.matchAll(/([MLC])([^MLCZ]+)/g)].reduce<{ point: number[]; starts: number[][] }>((acc, [, cmd, args]) => {
    const n = args.trim().split(/\s+/).map(Number);
    if (cmd === "C") acc.starts.push(acc.point);
    acc.point = n.slice(-2);
    return acc;
  }, { point: [], starts: [] }).starts;
  assert.ok(curves.length <= 6, `expected at most 6 curves, got ${curves.length}`);
  curves.forEach(([c1x, , c2x, , x], i) => {
    const dir = Math.sign(x - starts[i][0]);
    // Handles move in the curve's direction and never cross, so the edge never doubles back on itself.
    assert.ok((c1x - starts[i][0]) * dir >= 0 && (c2x - c1x) * dir >= 0 && (x - c2x) * dir >= 0, `curve ${i} doubles back`);
  });
  for (let i = 1; i < curves.length; i++) {
    const [px, py] = curves[i - 1].slice(4);
    if (starts[i][0] !== px || starts[i][1] !== py) continue; // a straight edge sits between them
    const into = [px - curves[i - 1][2], py - curves[i - 1][3]];
    const out = [curves[i][0] - px, curves[i][1] - py];
    const cross = into[0] * out[1] - into[1] * out[0];
    const dot = into[0] * out[0] + into[1] * out[1];
    assert.ok(dot > 0 && Math.abs(cross) / (Math.hypot(...into) * Math.hypot(...out)) < .02, `kink between curves ${i - 1} and ${i}`);
  }
});

test("Daily Mix offers the standard and wide fonts but not condensed; a condensed choice from another style shows as standard", () => {
  assert.deepEqual(spotifyFonts("spotify-daily-mix"), ["standard", "wide"]);
  assert.equal(spotifyFontFor("spotify-daily-mix", "condensed"), "standard");
  // Other Spotify styles keep all three fonts and the condensed choice.
  assert.deepEqual(spotifyFonts("spotify-band"), ["standard", "wide", "condensed"]);
  assert.equal(spotifyFontFor("spotify-band", "condensed"), "condensed");
});

test("the new Daily Mix number uses the wide round Unbounded face with the standard font, and the title font otherwise", () => {
  assert.deepEqual(dailyMixNumberFace("standard"), { weight: 400, family: "CoverFontMix, CoverFontBold, Arial, sans-serif" });
  assert.deepEqual(dailyMixNumberFace("wide"), spotifyFace("wide"));
});

test("the classic Daily Mix wave leaves the top-left logo as much room as the logo has from the cover's edges", () => {
  const center = SPOTIFY_LOGO.pad + SPOTIFY_LOGO.size / 2, radius = SPOTIFY_LOGO.size / 2;
  let point = [0, 0];
  let closest = Infinity;
  for (const [, cmd, args] of DAILY_MIX_WAVE.matchAll(/([MLC])([^MLCZ]+)/g)) {
    const n = args.trim().split(/\s+/).map(Number);
    if (cmd === "C") {
      for (let i = 0; i <= 400; i++) {
        const t = i / 400, u = 1 - t;
        const x = u ** 3 * point[0] + 3 * u * u * t * n[0] + 3 * u * t * t * n[2] + t ** 3 * n[4];
        const y = u ** 3 * point[1] + 3 * u * u * t * n[1] + 3 * u * t * t * n[3] + t ** 3 * n[5];
        closest = Math.min(closest, Math.hypot(x - center, y - center) - radius);
      }
    }
    point = n.slice(-2);
  }
  assert.ok(closest >= SPOTIFY_LOGO.pad, `the wave comes within ${closest.toFixed(1)}px of the logo`);
});

test("the classic Daily Mix wave has no sharp turns: every bend is gentle, and bends ease into each other where curves meet", () => {
  const curves: number[][][] = [];
  let point = [0, 0];
  for (const [, cmd, args] of DAILY_MIX_WAVE.matchAll(/([MLC])([^MLCZ]+)/g)) {
    const n = args.trim().split(/\s+/).map(Number);
    if (cmd === "C") curves.push([point, n.slice(0, 2), n.slice(2, 4), n.slice(4, 6)]);
    point = n.slice(-2);
  }
  // Signed curvature of a cubic Bézier at t, from its first and second derivatives.
  const curvature = ([p0, c1, c2, p3]: number[][], t: number) => {
    const u = 1 - t;
    const d1 = [0, 1].map(k => 3 * u * u * (c1[k] - p0[k]) + 6 * u * t * (c2[k] - c1[k]) + 3 * t * t * (p3[k] - c2[k]));
    const d2 = [0, 1].map(k => 6 * u * (c2[k] - 2 * c1[k] + p0[k]) + 6 * t * (p3[k] - 2 * c2[k] + c1[k]));
    return (d1[0] * d2[1] - d1[1] * d2[0]) / Math.hypot(d1[0], d1[1]) ** 3;
  };
  curves.forEach((curve, i) => {
    const tightest = Math.max(...Array.from({ length: 401 }, (_, j) => Math.abs(curvature(curve, j / 400))));
    assert.ok(1 / tightest >= 180, `curve ${i} bends with a ${Math.round(1 / tightest)}px radius`);
  });
  for (let i = 1; i < curves.length; i++) {
    const [px, py] = curves[i - 1][3];
    if (curves[i][0][0] !== px || curves[i][0][1] !== py) continue; // a straight edge sits between them
    const before = Math.abs(curvature(curves[i - 1], 1)), after = Math.abs(curvature(curves[i], 0));
    assert.ok(Math.abs(before - after) / Math.max(before, after) <= .2, `the bend changes abruptly between curves ${i - 1} and ${i}`);
  }
});

test("Daily Mix starts with its designs' title sizes and a 190px number", () => {
  assert.equal(styleDefaults("spotify-daily-mix").dailyMixFontSize, 120);
  assert.equal(DAILY_MIX_NUMBER_SIZE, 190);
});

test("the classic Daily Mix title keeps its bottom edge at any size and grows upward with room for two lines", () => {
  for (const size of [72, 120, 200]) {
    const box = dailyMixTitleBox(size);
    assert.equal(box.x, 128);
    assert.equal(box.width, 1200 - 128 * 2);
    assert.equal(box.y + box.height, 1102);
    assert.ok(box.height >= size * 1.02 * 2, `two ${size}px lines fit`);
  }
  // The default size keeps the box it had before the size became adjustable.
  assert.deepEqual(dailyMixTitleBox(120), { x: 128, y: 852, width: 944, height: 250 });
});
