# Cover Studio

A Next.js cover editor with the  40 gradients, seven color backgrounds, fonts, and Apple Music vector artwork from the supplied source.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000 for the editor (`/editor` redirects there). To check and build:

```sh
npm run typecheck
npm run build
npm start
```

## Features

- Original layout with title, subtitle, footer, and gradient/color/solid/photo backgrounds.
- Apple Music logo toggle, classic or new logo style, all four corner positions, and custom text/logo color.
- Every color setting offers basic color swatches plus a multicolor swatch that opens a custom color picker.
- Essentials layout with an adjustable title band, solid color or original pattern.
- Platform picker: Apple Music (Original, Essentials) or Spotify (Original, This Is, Band) cover styles, each with its own logo.
- Spotify titles wrap across lines, with top/bottom position, left/right alignment, size, and band/accent colors.
- Spotify Original style: a title over a full-cover photo, with the same gradient/color/solid/photo background options as Apple's Original, defaulting to photo.
- Spotify Original and Band styles: title only or title & subtitle, with separate title and subtitle sizes; Band also has a photo frame (side margin, margin next to the band, rounded corners) and can color the logo like the band.
- Spotify This Is style: adjustable heading ("THIS IS") size.
- Spotify title font: standard (SF Pro Bold) or a wide brutalist face (Archivo Expanded Black).
- Local JPG, PNG, and WebP upload, zoom and horizontal/vertical crop controls.
- Original, monochrome, or customizable duotone photo treatment.
- Full-resolution 1200 × 1200 PNG download, using the same renderer as the preview.
- Responsive desktop/mobile editor, keyboard-accessible controls, and reset.

Photos are processed locally in the browser, with no upload service, analytics, or external font requests. Editing state is session-only and resets when the page reloads. With no photo selected, Essentials uses the chosen background. Logo color follows text color, including when placed over a photo.

## Project structure

- `app/page.tsx`: editor controls, upload handling, preview, and download.
- `app/globals.css`: responsive dark editor styles.
- `lib/render-cover.ts`: shared Canvas renderer with crop and pixel-based photo treatment.
- `lib/apple-logo.ts`: vector path reused from the provided original source.
- `public/assets`: original backgrounds and fonts.

## License

The source code is released under the [MIT License](LICENSE). Third-party assets, such as the SF Pro fonts and the Apple Music and Spotify logos, remain the property of their respective owners and are not covered by this license. Archivo is licensed under the SIL Open Font License 1.1 (see `public/assets/fonts/Archivo-OFL.txt`).
