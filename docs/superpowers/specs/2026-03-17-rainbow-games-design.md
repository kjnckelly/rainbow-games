# Rainbow Games — Design Spec

**Date:** 2026-03-17
**Status:** Approved

---

## Overview

Rainbow Games is a personal-use Vue 3 Progressive Web App (PWA) that serves as a curated index of card games for family use. Users can browse and filter games by several criteria, then open any game to read its full rules. The app owner manually maintains game content in Markdown files; no user-generated content or authentication is required.

---

## Goals

- Provide a fast, offline-capable reference for card game rules during game night
- Allow quick filtering to find a game that fits the current situation (number of players, time available, etc.)
- Be installable on phones and tablets as a PWA
- Keep content maintenance simple: add a new `.md` file → game appears in the app

---

## Out of Scope

- User accounts or authentication
- User-submitted games or edits
- Images or cover art per game
- Game descriptions / elevator pitches
- Variations or strategy notes
- Any backend or database

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Build tool | Vite |
| Language | TypeScript |
| PWA | `vite-plugin-pwa` (Workbox) |
| Routing | `vue-router` |
| Markdown rendering | `markdown-it` |
| Frontmatter parsing | `gray-matter` |
| Styling | CSS custom properties (no UI framework) |

---

## Data Model

Each game is a single Markdown file stored in `src/games/`. The file uses YAML frontmatter for structured metadata; the document body contains the full rules in Markdown.

**File location:** `src/games/<slug>.md`

**Frontmatter schema:**

```yaml
---
name: Go Fish
players_min: 2
players_max: 5
duration: quick        # quick | medium | long
category: competitive  # competitive | cooperative
equipment: false       # true | false
---
```

**Body:** Free-form Markdown rules/instructions.

**Slug:** Derived from the filename (e.g., `go-fish.md` → slug `go-fish`).

**Loading mechanism:** `import.meta.glob('../games/*.md', { as: 'raw' })` loads all game files at Vite build time. The `useGames` composable parses each file's frontmatter and exposes the structured game list to components.

---

## Filtering

Filters are surfaced in a `FilterBar` component at the top of the home screen. All filters default to "Any" (no restriction). Active filters are applied additively (AND logic).

| Filter | Type | Options |
|---|---|---|
| Players | Number selector | 2, 3, 4, 5, 6, 6+ (checks that value falls within `players_min`–`players_max`) |
| Duration | Toggle chips | Any / Quick / Medium / Long |
| Category | Toggle chips | Any / Competitive / Cooperative |
| Equipment | Toggle chips | Any / No extras needed / Special equipment |

---

## Routing

| Route | View | Description |
|---|---|---|
| `/` | `HomeView` | Filter bar + game card grid |
| `/game/:slug` | `GameView` | Full-page rules for a single game |

Navigating to an unknown slug shows a simple "Game not found" message with a back link.

---

## Component Structure

```
src/
├── games/                  ← Markdown source files (one per game)
├── composables/
│   └── useGames.ts         ← Loads, parses, and filters all game data
├── views/
│   ├── HomeView.vue        ← Filter bar + responsive card grid
│   └── GameView.vue        ← Single game detail page
├── components/
│   ├── FilterBar.vue       ← All filter controls
│   └── GameCard.vue        ← Individual game card (neon accent color)
├── router/
│   └── index.ts            ← Route definitions
├── App.vue                 ← Root component with <RouterView>
└── main.ts                 ← App entry point
```

### `useGames.ts`

- Uses `import.meta.glob` to load all `.md` files
- Parses frontmatter with `gray-matter`
- Exposes `games` (full list) and `filteredGames` (reactive, based on active filters)
- Exposes `activeFilters` ref and `setFilter` method
- Returns `getGameBySlug(slug)` for the detail view

### `FilterBar.vue`

- Receives active filters as props, emits `filter-change` events
- Player count: numeric chip selector (2 / 3 / 4 / 5 / 6+)
- Duration, Category, Equipment: toggle chip groups
- "Clear all" resets all filters to "Any"

### `GameCard.vue`

- Displays game name with one of 6 cycling neon accent colors
- Shows metadata chips: players range, duration, category, equipment indicator
- Entire card is a `<RouterLink>` to `/game/:slug`

### `GameView.vue`

- Back button (← arrow) returns to `/`
- Game name as heading with neon accent color
- Metadata chips (same set as card)
- Rendered Markdown rules body (via `markdown-it`)
- Scrollable, full-width layout

---

## Visual Design

**Theme:** Dark mode with neon accents.

- Background: deep navy (`#1a1a2e`)
- Card backgrounds: dark blue-grey (`#16213e`)
- Card borders: subtle (`#0f3460`)
- Game name accent colors: 6 rotating neons (red, cyan, green, purple, orange, pink)
- Filter chips: dark background, neon border when active
- Typography: system sans-serif stack

**Layout:** Responsive CSS grid. Cards stretch to fill available width, minimum card width ~150px. Filter bar scrolls horizontally on small screens.

---

## PWA Configuration

- **Manifest:** App name "Rainbow Games", dark background color, standalone display mode
- **Service worker:** Workbox `generateSW` strategy, precaches all static assets and game Markdown files
- **Offline:** Full functionality available after first load — no network required
- **Install prompt:** Browser-native install prompt; no custom install UI needed for personal use

---

## File Organization (full project)

```
rainbow-games/
├── public/
│   └── icons/              ← PWA icons (192×192, 512×512)
├── src/
│   ├── games/              ← .md files
│   ├── components/
│   ├── composables/
│   ├── views/
│   ├── router/
│   ├── App.vue
│   ├── main.ts
│   └── style.css           ← Global CSS custom properties / reset
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-03-17-rainbow-games-design.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Error Handling

- Unknown slug on `/game/:slug`: render a "Game not found" message with a link back to home
- Malformed frontmatter in a `.md` file: skip that file and log a console warning at build time
- No games match active filters: render an empty state message ("No games match — try adjusting your filters")

---

## Testing Considerations

- `useGames.ts` composable is pure logic — unit-testable with mock `.md` file content
- Filter logic (range check for players, exact match for other fields) should have unit tests
- Component tests (Vitest + Vue Test Utils) for `FilterBar` filter state and `GameCard` rendering
- No E2E tests required for personal-use scope
