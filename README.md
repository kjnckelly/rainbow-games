# Rainbow Games

A family card game reference app. Browse and filter games by player count, duration, category, and equipment — with full rules on a dedicated page. Installable as a PWA for offline use.

---

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Adding a game

1. Create a new `.md` file in `src/games/`. The filename becomes the URL slug (e.g. `crazy-eights.md` → `/game/crazy-eights`).

2. Start the file with a YAML frontmatter block:

```markdown
---
name: Crazy Eights
players_min: 2
players_max: 5
duration: quick
category: competitive
equipment: false
deck: rainbow
---

Write the rules here in Markdown.
```

**Frontmatter fields:**

| Field | Type | Values |
|---|---|---|
| `name` | string | Display name of the game |
| `players_min` | number | Minimum player count |
| `players_max` | number | Maximum player count |
| `duration` | string | `quick`, `medium`, or `long` |
| `category` | string | `competitive` or `cooperative` |
| `equipment` | boolean | `true` if special cards/equipment needed, `false` for a standard deck |
| `deck` | string | `rainbow` or `face` |

3. Save the file. The dev server will hot-reload and the card will appear immediately. No other changes needed.

---

## Hosting

The app builds to a folder of static files — no server required.

**Build:**

```bash
npm run build
```

The `dist/` folder contains everything needed to host the app.

**Deploy options:**

- **Netlify** — drag and drop the `dist/` folder at [netlify.com/drop](https://netlify.com/drop)
- **GitHub Pages** — push the repo, then in Settings → Pages point it at the `dist/` folder (or use the [deploy to GitHub Pages action](https://github.com/marketplace/actions/deploy-to-github-pages))
- **Vercel** — run `npx vercel` in the project root; it auto-detects Vite
- **Any static host** — upload the contents of `dist/` via FTP or your host's file manager

The app uses hash-based routing (`/#/game/slug`), so no special server configuration is needed.

---

## Installing as a PWA

Once hosted, the app can be installed on any device for offline use.

**On iPhone/iPad (Safari):**
1. Open the hosted URL in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

**On Android (Chrome):**
1. Open the hosted URL in Chrome
2. Tap the three-dot menu
3. Tap **Add to Home screen** (or look for an install banner at the bottom)
4. Tap **Install**

**On desktop (Chrome/Edge):**
1. Open the hosted URL
2. Look for the install icon in the address bar (a computer with a download arrow)
3. Click it and confirm

After installation, the app works fully offline — all game rules are bundled at build time, so no internet connection is needed once installed.

---

## Development

```bash
npm test          # run tests once
npm run test:watch  # run tests in watch mode
npm run build     # production build
npm run preview   # preview the production build locally
```
