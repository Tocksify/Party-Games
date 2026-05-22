# Glo's Party Games — Electron Desktop App

This wraps the Vercel frontend in an Electron desktop app with a native installer.

## Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn

## Setup

```bash
cd electron
npm install
```

## Run in development

```bash
npm start
```

## Build installers

**Windows (.exe installer):**
```bash
npm run build:win
```

**Mac (.dmg):**
```bash
npm run build:mac
```

**Linux (AppImage):**
```bash
npm run build:linux
```

The built installer appears in `electron/dist/`.

## Icons

Place your icon files in `electron/build/`:
- `icon.ico` — Windows (256x256 recommended)
- `icon.icns` — Mac
- `icon.png` — Linux (512x512 recommended)

If no icons are provided, electron-builder will use a default icon.

## Notes

- The app loads `https://party-games-api-server.vercel.app` — requires internet
- If the connection fails, a branded offline page is shown
- External links open in the system browser
- Building a Windows .exe must be done on a Windows machine (or via GitHub Actions)
- Building a Mac .dmg must be done on a Mac
