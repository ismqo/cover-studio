<p align="center">
  <img src="public/assets/brand/cover-studio-logo.svg" alt="Cover Studio logo" width="160" height="160">
</p>

# Cover Studio

A Next.js editor for Apple Music and Spotify playlist covers. It ships with 40 background gradients, SF Pro, Archivo, and Unbounded fonts, and Apple Music and Spotify vector logos. Everything runs in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000 for the editor (`/editor` redirects there). To check, test, and build:

```sh
npm run typecheck
node --test tests/*.test.mts
npm run build
npm start
```

## Cover styles

Pick a platform (Apple Music or Spotify), then one of its styles. Each style starts with its own look, and each platform draws its own logo.

### Apple Music

- **Original**: title, subtitle, and description over a gradient, color, or photo background. Title and subtitle have their own size and weight. You can set the gap between them, align them left or center, and move them up or down.
- **Essentials**: a photo under a colored title band. You can set the title size, band height, and band color, and frame the photo with a side margin, a top margin, and rounded corners.
- **Similar Artist Radio**: 1, 2, or 3 artist bubbles. The main artist is a large centered bubble. A second artist sits on its top-left edge and a third on its bottom-right edge, with a gap cut into the main bubble around each. Every artist has its own photo, photo treatment, and crop. It uses Original's gradient and color backgrounds; there is no photo background.

### Spotify

- **Original (Full photo)**: a title, and optionally a subtitle, over a full-cover photo, gradient, or color. You choose top or bottom placement and left or right alignment.
- **This Is**: a "THIS IS" heading with an adjustable size, a photo, and the artist name on an accent color.
- **Band**: a photo plus a colored band holding the title and an optional subtitle. You can set the band's position, height, and color. The photo can have a frame (side margin, margin next to the band, rounded corners), and the logo can take the band color.
- **Daily Mix**: a title (default "Daily Mix", up to 2 lines) and a mix number from 1 to 99 that you can hide, in two designs:
  - Classic: the photo shows through a wavy window, traced from Spotify's covers, in a color whose opacity you can set (88% by default, so the photo shows faintly through it). The title followed by the number ("Daily Mix 4") sits at the bottom-left.
  - New: a full-cover photo with each title line in a color label at the bottom-left and the two-digit number ("01") in one at the bottom-right. The logo takes the label color.
  - With the standard font, the new design's number uses Unbounded Regular, whose wide round digits match Spotify's number labels.
  - Daily Mix offers the standard and wide fonts only; a condensed choice made in another style shows as standard.
  - The title size is adjustable (Classic 120px and New 112px by default), and so is the New design's number size (190px by default). A long title shrinks to stay clear of the number.
  - The mix number has its own section in the editor: show or hide it, set it, and (New design) size it.
  - Switching design restores that design's colors, photo treatment, and title size.

Spotify titles have three fonts: Standard (SF Pro Bold), Wide (Archivo Expanded Black), and Condensed (Archivo Condensed Bold). Title and subtitle sizes and the gap between them are adjustable. Long titles wrap across lines.

## Editing

- **Text**: every style's title accepts manual line breaks (Enter).
  - Original pushes the subtitle down.
  - Essentials grows the title upward and makes the band taller when needed.
  - Spotify keeps your breaks and still wraps long lines. This Is and Daily Mix allow up to 2 lines.
- **Colors**: every color setting offers basic swatches, plus a multicolor swatch that opens a custom color picker.
- **Backgrounds**: 40 gradients, a custom color, or a photo (in the styles that offer one).
  - The custom color can carry a shadow shaded in a linear, radial, diamond, or reflected gradient.
  - With the shadow off, the color is flat.
- **Photos**: local JPG, PNG, or WebP (up to 20 MB).
  - Zoom and horizontal/vertical crop.
  - Original, mono, or duotone treatment with a tint color.
  - Brightness and contrast, with a reset back to the style's starting look.
- **Logo**: show or hide it.
  - Apple Music has a classic or a new logo.
  - Original and Spotify Full photo let you choose the corner. In Full photo, the title's corner is taken, so the logo moves to the other side.
  - The other styles pin the logo: top-right for Essentials and Similar Artist Radio, top-left for This Is, Band, and Daily Mix.
- **Sliders**: double-click (or double-tap) a slider's thumb to glide it back to its default value.

## Editor

- **Inspector layout**: the live preview takes the main area, and the settings are a full-height panel on the right. On phones, the preview sits above the settings, and each field sits below its label.
- **Save versions**: the archive button saves the cover. The newest 3 versions are kept in the browser's IndexedDB with their photos, and appear as thumbnails beside the preview. Click one to restore it; the trash button deletes them all after a confirmation.
- **Download**: a full-resolution 1200 × 1200 PNG, drawn by the same renderer as the preview, revealed with a short CD-case animation. On phones, small round buttons in the preview's corners reset, save, and download.
- **Reset**: restores the default cover after a confirmation.
- **Preview tilt**: drag the preview to tilt it. This respects reduced-motion settings.
- **Language**: English or Spanish, from the menu in the navbar. It defaults to the browser language and is remembered in `localStorage`.
- **Accessibility**: keyboard-accessible controls, reduced-motion and forced-colors support, and a dark glass interface.

Photos are processed locally in the browser: there is no upload service, analytics, or external font request. Unsaved edits reset when the page reloads; saved versions stay until deleted.

## Project structure

- `app/page.tsx`: editor controls, uploads, saved versions, preview, and download.
- `app/globals.css`: responsive glass editor styles.
- `lib/render-cover.ts`: shared Canvas renderer for every style, with crop and pixel-based photo treatment.
- `lib/cover-layout.ts`: pure layout rules (styles, title fitting and line breaks, logo corners, gradients, artist bubbles), covered by tests.
- `lib/cover-memories.ts`: saved versions in IndexedDB.
- `lib/i18n.ts`, `components/locale-provider.tsx`: English and Spanish text.
- `components/`: shared controls (sliders, switches, confirmation dialog, navbar menu).
- `lib/apple-logo.ts`, `lib/spotify-logo.ts`: logo vector paths.
- `tests/`: `node:test` suites for the layout rules and helpers.
- `public/assets`: backgrounds, fonts, and brand images.

## License

The source code is released under the [MIT License](LICENSE). Third-party assets, such as the SF Pro fonts and the Apple Music and Spotify logos, remain the property of their respective owners and are not covered by this license. Archivo and Unbounded are licensed under the SIL Open Font License 1.1 (see `public/assets/fonts/Archivo-OFL.txt` and `public/assets/fonts/Unbounded-OFL.txt`).
