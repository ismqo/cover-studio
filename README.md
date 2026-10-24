# Cover Studio

A Next.js cover editor with the  40 gradients, seven color backgrounds, fonts, and Apple Music vector artwork from the supplied source.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000 for the landing page or http://localhost:3000/editor for the editor. To check and build:

```sh
npm run typecheck
npm run build
npm start
```

## Features

- Original layout with title, subtitle, footer, and gradient/color/custom backgrounds.
- Apple Music logo toggle, all four corner positions, and custom text/logo color.
- Essentials layout with an adjustable title band, solid color or original pattern.
- Local JPG, PNG, and WebP upload, zoom and horizontal/vertical crop controls.
- Original, monochrome, or customizable duotone photo treatment.
- Full-resolution 1200 × 1200 PNG download, using the same renderer as the preview.
- Responsive desktop/mobile editor, keyboard-accessible controls, and reset.

Photos are processed locally in the browser, with no upload service, analytics, or external font requests. Editing state is session-only and resets when the page reloads. With no photo selected, Essentials uses the chosen background. Logo color follows text color, including when placed over a photo.

## Project structure

- `app/page.tsx` and `app/landing.module.css`: landing page with an animated cover wall and editor CTAs.
- `app/editor/page.tsx`: editor controls, upload handling, preview, and download.
- `app/globals.css`: responsive dark editor styles.
- `lib/render-cover.ts`: shared Canvas renderer with crop and pixel-based photo treatment.
- `lib/apple-logo.ts`: vector path reused from the provided original source.
- `public/assets`: original backgrounds and fonts.

## License

The source code is released under the [MIT License](LICENSE). Third-party assets, such as the SF Pro fonts and the Apple Music logo, remain the property of their respective owners and are not covered by this license.
