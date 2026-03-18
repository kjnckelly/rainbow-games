# Rainbow Games Vue PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vue 3 PWA that lets a family browse and filter a curated collection of card games by player count, duration, category, and equipment, with full Markdown rules displayed on a dedicated detail page — installable and fully offline-capable.

**Architecture:** Vite bundles all `.md` game files at build time via `import.meta.glob`. A `useGames` composable parses frontmatter for filter metadata and exposes reactive filter state. Vue Router handles two routes: the card-grid home (`/`) and a per-game detail page (`/game/:slug`). Dark-mode UI with cycling neon accent colors per game card.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Vite 5, TypeScript, vue-router 4, vite-plugin-pwa (Workbox), markdown-it, gray-matter, Vitest, @vue/test-utils, jsdom

---

## File Map

| File | Responsibility |
|---|---|
| `src/types/game.ts` | `Game`, `FilterState` TypeScript interfaces |
| `src/composables/useGames.ts` | Load + parse `.md` files, reactive filter state, slug lookup |
| `src/composables/__tests__/useGames.test.ts` | Unit tests for all filter + parsing logic |
| `src/components/GameCard.vue` | Single game card — neon name, metadata chips, router link |
| `src/components/__tests__/GameCard.test.ts` | Component tests for GameCard |
| `src/components/FilterBar.vue` | Four filter chip groups — emits events, stateless |
| `src/components/__tests__/FilterBar.test.ts` | Component tests for FilterBar |
| `src/views/HomeView.vue` | Bridge between useGames, FilterBar, and GameCard grid |
| `src/views/GameView.vue` | Full-page rules view with markdown-it renderer |
| `src/router/index.ts` | Route definitions (`/` and `/game/:slug`) |
| `src/App.vue` | Root component — just `<RouterView />` |
| `src/main.ts` | App entry point — mounts app, registers router |
| `src/style.css` | CSS custom properties (dark theme + neon palette), global reset |
| `vite.config.ts` | Vite + vite-plugin-pwa + Vitest configuration |
| `public/icons/icon-192.png` | PWA icon (192×192) |
| `public/icons/icon-512.png` | PWA icon (512×512) |
| `src/games/*.md` | Game content files (user-maintained, 3 samples provided) |

---

## Task 1: Scaffold the project and install dependencies

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/App.vue`, `src/style.css`

- [ ] **Step 1: Scaffold with create-vite**

Run from `C:/Dev/kjnckelly/kjnc/rainbow-games/`:

```bash
npm create vite@latest . -- --template vue-ts
```

When prompted "Current directory is not empty", select **"Ignore files and continue"** (this keeps the existing `docs/` folder).

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install vue-router@4 markdown-it gray-matter
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vite-plugin-pwa vitest @vue/test-utils jsdom @types/gray-matter
```

- [ ] **Step 4: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite dev server running at `http://localhost:5173`. A default Vue welcome page should appear. Press `Ctrl+C` to stop.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vue 3 + Vite project with dependencies"
```

---

## Task 2: Configure Vite (PWA + Vitest)

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Replace `vite.config.ts` with the full configuration**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Rainbow Games',
        short_name: 'Rainbow Games',
        description: 'A family card game rules reference',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // .md files do not need to be listed here — import.meta.glob with eager:true
        // inlines all game content into the JS bundle at build time, so it is already cached.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 2: Verify Vite still starts without errors**

```bash
npm run dev
```

Expected: Server starts. No errors about missing plugins.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "chore: configure vite-plugin-pwa and Vitest"
```

---

## Task 3: Define TypeScript types

**Files:**
- Create: `src/types/game.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/game.ts

export interface Game {
  slug: string
  name: string
  playersMin: number
  playersMax: number
  duration: 'quick' | 'medium' | 'long'
  category: 'competitive' | 'cooperative'
  equipment: boolean
  content: string  // raw Markdown body
}

export type PlayerFilter = 2 | 3 | 4 | 5 | 6 | null  // 6 means "6+", null means "any"
export type DurationFilter = 'quick' | 'medium' | 'long' | null
export type CategoryFilter = 'competitive' | 'cooperative' | null
export type EquipmentFilter = boolean | null  // true = needs equipment, false = standard, null = any

export interface FilterState {
  players: PlayerFilter
  duration: DurationFilter
  category: CategoryFilter
  equipment: EquipmentFilter
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add Game and FilterState TypeScript types"
```

---

## Task 4: `useGames` composable (TDD)

**Files:**
- Create: `src/composables/__tests__/useGames.test.ts`
- Create: `src/composables/useGames.ts`

The composable accepts an optional `rawModules` parameter so tests can inject mock data without touching `import.meta.glob`.

- [ ] **Step 1: Create the test directory and write failing tests**

```bash
mkdir -p src/composables/__tests__
```

```typescript
// src/composables/__tests__/useGames.test.ts
import { describe, it, expect } from 'vitest'
import { useGames } from '../useGames'

const MOCK_MODULES: Record<string, string> = {
  '/src/games/go-fish.md': `---
name: Go Fish
players_min: 2
players_max: 5
duration: quick
category: competitive
equipment: false
---
## How to Play
Ask for cards.`,

  '/src/games/rummy.md': `---
name: Rummy
players_min: 2
players_max: 6
duration: long
category: competitive
equipment: false
---
## How to Play
Form sets and runs.`,

  '/src/games/hanabi.md': `---
name: Hanabi
players_min: 2
players_max: 5
duration: medium
category: cooperative
equipment: true
---
## How to Play
Work together.`,
}

describe('useGames', () => {
  it('returns all games sorted alphabetically by name', () => {
    const { games } = useGames(MOCK_MODULES)
    expect(games).toHaveLength(3)
    expect(games[0].name).toBe('Go Fish')
    expect(games[1].name).toBe('Hanabi')
    expect(games[2].name).toBe('Rummy')
  })

  it('parses game metadata correctly from frontmatter', () => {
    const { games } = useGames(MOCK_MODULES)
    const goFish = games.find(g => g.slug === 'go-fish')!
    expect(goFish.name).toBe('Go Fish')
    expect(goFish.playersMin).toBe(2)
    expect(goFish.playersMax).toBe(5)
    expect(goFish.duration).toBe('quick')
    expect(goFish.category).toBe('competitive')
    expect(goFish.equipment).toBe(false)
    expect(goFish.content).toContain('Ask for cards')
  })

  it('derives slug from filename', () => {
    const { games } = useGames(MOCK_MODULES)
    expect(games.map(g => g.slug)).toEqual(['go-fish', 'hanabi', 'rummy'])
  })

  it('getGameBySlug returns the matching game', () => {
    const { getGameBySlug } = useGames(MOCK_MODULES)
    expect(getGameBySlug('rummy')?.name).toBe('Rummy')
  })

  it('getGameBySlug returns undefined for unknown slug', () => {
    const { getGameBySlug } = useGames(MOCK_MODULES)
    expect(getGameBySlug('not-a-game')).toBeUndefined()
  })

  it('filteredGames returns all games when no filters are active', () => {
    const { filteredGames } = useGames(MOCK_MODULES)
    expect(filteredGames.value).toHaveLength(3)
  })

  it('filters by player count — selected count must fall within min/max range', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('players', 2)
    expect(filteredGames.value).toHaveLength(3)  // all support 2 players
  })

  it('filters by player count 6+ — matches games where playersMax >= 6', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('players', 6)
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Rummy')
  })

  it('filters by duration', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('duration', 'quick')
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Go Fish')
  })

  it('filters by category', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('category', 'cooperative')
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Hanabi')
  })

  it('filters by equipment (false = no special equipment needed)', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('equipment', false)
    expect(filteredGames.value).toHaveLength(2)
    expect(filteredGames.value.map(g => g.name)).not.toContain('Hanabi')
  })

  it('filters by equipment (true = special equipment needed)', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('equipment', true)
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Hanabi')
  })

  it('combines multiple filters with AND logic', () => {
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('category', 'competitive')
    setFilter('duration', 'long')
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Rummy')
  })

  it('clearFilters resets all active filters', () => {
    const { filteredGames, setFilter, clearFilters } = useGames(MOCK_MODULES)
    setFilter('duration', 'quick')
    expect(filteredGames.value).toHaveLength(1)
    clearFilters()
    expect(filteredGames.value).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run tests — confirm they all fail**

```bash
npx vitest run src/composables/__tests__/useGames.test.ts
```

Expected: All tests fail with "Cannot find module '../useGames'".

- [ ] **Step 3: Implement the composable**

```typescript
// src/composables/useGames.ts
import { ref, computed } from 'vue'
import matter from 'gray-matter'
import type { Game, FilterState } from '../types/game'

// Module-level: parse once at startup (not on every composable call)
const DEFAULT_RAW_MODULES = import.meta.glob('../games/*.md', {
  as: 'raw',
  eager: true,
}) as Record<string, string>

function parseGame(path: string, raw: string): Game | null {
  try {
    const { data, content } = matter(raw)
    const slug = path.split('/').pop()!.replace('.md', '')
    return {
      slug,
      name: String(data.name),
      playersMin: Number(data.players_min),
      playersMax: Number(data.players_max),
      duration: data.duration as Game['duration'],
      category: data.category as Game['category'],
      equipment: Boolean(data.equipment),
      content,
    }
  } catch (err) {
    console.warn(`Failed to parse game file: ${path}`, err)
    return null
  }
}

function buildGameList(rawModules: Record<string, string>): Game[] {
  return Object.entries(rawModules)
    .map(([path, raw]) => parseGame(path, raw))
    .filter((g): g is Game => g !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

const ALL_GAMES = buildGameList(DEFAULT_RAW_MODULES)

const DEFAULT_FILTERS: FilterState = {
  players: null,
  duration: null,
  category: null,
  equipment: null,
}

export function useGames(rawModules?: Record<string, string>) {
  const games = rawModules ? buildGameList(rawModules) : ALL_GAMES

  const activeFilters = ref<FilterState>({ ...DEFAULT_FILTERS })

  const filteredGames = computed(() => {
    const f = activeFilters.value
    return games.filter(game => {
      if (f.players !== null) {
        if (f.players === 6) {
          // "6+" means the game supports at least 6 players
          if (game.playersMax < 6) return false
        } else {
          // Selected number must fall within the game's player range
          if (f.players < game.playersMin || f.players > game.playersMax) return false
        }
      }
      if (f.duration !== null && game.duration !== f.duration) return false
      if (f.category !== null && game.category !== f.category) return false
      if (f.equipment !== null && game.equipment !== f.equipment) return false
      return true
    })
  })

  function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    activeFilters.value = { ...activeFilters.value, [key]: value }
  }

  function clearFilters() {
    activeFilters.value = { ...DEFAULT_FILTERS }
  }

  function getGameBySlug(slug: string): Game | undefined {
    return games.find(g => g.slug === slug)
  }

  return { games, filteredGames, activeFilters, setFilter, clearFilters, getGameBySlug }
}
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npx vitest run src/composables/__tests__/useGames.test.ts
```

Expected: All 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/composables/
git commit -m "feat: add useGames composable with filter logic"
```

---

## Task 5: Global styles, App.vue, and main.ts

**Files:**
- Modify: `src/style.css`
- Modify: `src/App.vue`
- Modify: `src/main.ts`

- [ ] **Step 1: Replace `src/style.css` with the dark theme**

```css
/* src/style.css */
:root {
  --bg-primary: #1a1a2e;
  --bg-card: #16213e;
  --border-card: #0f3460;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  /* Cycling neon accent colors for game cards */
  --neon-1: #e94560;
  --neon-2: #4facfe;
  --neon-3: #43e97b;
  --neon-4: #f093fb;
  --neon-5: #ffa751;
  --neon-6: #a18cd1;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
}
```

- [ ] **Step 2: Replace `src/App.vue`**

```vue
<!-- src/App.vue -->
<template>
  <RouterView />
</template>
```

- [ ] **Step 3: Replace `src/main.ts`**

```typescript
// src/main.ts
import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'
import './style.css'

createApp(App).use(router).mount('#app')
```

- [ ] **Step 4: Commit**

```bash
git add src/style.css src/App.vue src/main.ts
git commit -m "feat: add global dark theme styles and minimal App.vue"
```

---

## Task 6: Router setup

**Files:**
- Create: `src/router/index.ts`

- [ ] **Step 1: Create the router**

```bash
mkdir -p src/router
```

```typescript
// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'

export const router = createRouter({
  // Hash history works without server configuration — required for static PWA hosting
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/game/:slug', component: GameView },
  ],
})
```

- [ ] **Step 2: Create placeholder view stubs** (so the app compiles before views are fully built)

```bash
mkdir -p src/views
```

```vue
<!-- src/views/HomeView.vue -->
<template><div>Home (coming soon)</div></template>
```

```vue
<!-- src/views/GameView.vue -->
<template><div>Game (coming soon)</div></template>
```

- [ ] **Step 3: Verify the app compiles and routes work**

```bash
npm run dev
```

Open `http://localhost:5173`. Should show "Home (coming soon)". Navigate to `http://localhost:5173/#/game/test` — should show "Game (coming soon)". Press `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add src/router/ src/views/
git commit -m "feat: add Vue Router with home and game-detail routes"
```

---

## Task 7: `GameCard` component (TDD)

**Files:**
- Create: `src/components/__tests__/GameCard.test.ts`
- Create: `src/components/GameCard.vue`

- [ ] **Step 1: Create the test directory and write failing tests**

```bash
mkdir -p src/components/__tests__
```

```typescript
// src/components/__tests__/GameCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import GameCard from '../GameCard.vue'
import type { Game } from '../../types/game'

const TEST_GAME: Game = {
  slug: 'go-fish',
  name: 'Go Fish',
  playersMin: 2,
  playersMax: 5,
  duration: 'quick',
  category: 'competitive',
  equipment: false,
  content: '## Rules\nAsk for cards.',
}

const TEST_GAME_EQUAL_PLAYERS: Game = {
  ...TEST_GAME,
  slug: 'war',
  name: 'War',
  playersMin: 2,
  playersMax: 2,
}

// Router is required because GameCard uses <RouterLink>
const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })

describe('GameCard', () => {
  it('renders the game name', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('Go Fish')
  })

  it('links to the correct game route', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.find('a').attributes('href')).toContain('go-fish')
  })

  it('shows player range as "min–max" when min differs from max', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('2–5')
  })

  it('shows single player count when min equals max', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME_EQUAL_PLAYERS, index: 0 },
    })
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).not.toContain('2–2')
  })

  it('shows duration chip', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('quick')
  })

  it('shows category chip', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('competitive')
  })

  it('assigns neon color based on index (cycles through 6 colors)', () => {
    const wrapper0 = mount(GameCard, { global: { plugins: [router] }, props: { game: TEST_GAME, index: 0 } })
    const wrapper6 = mount(GameCard, { global: { plugins: [router] }, props: { game: TEST_GAME, index: 6 } })
    const color0 = wrapper0.find('.game-name').attributes('style')
    const color6 = wrapper6.find('.game-name').attributes('style')
    expect(color0).toBe(color6)  // index 0 and 6 use same color (cycles)
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/components/__tests__/GameCard.test.ts
```

Expected: Tests fail with "Cannot find module '../GameCard.vue'".

- [ ] **Step 3: Implement `GameCard.vue`**

```vue
<!-- src/components/GameCard.vue -->
<template>
  <RouterLink :to="`/game/${game.slug}`" class="game-card">
    <h3 class="game-name" :style="{ color: neonColor }">{{ game.name }}</h3>
    <div class="chips">
      <span class="chip">👥 {{ playerRange }}</span>
      <span class="chip">⏱ {{ game.duration }}</span>
      <span class="chip">{{ game.category === 'competitive' ? '⚔️' : '🤝' }} {{ game.category }}</span>
      <span class="chip" :class="{ 'chip--highlight': game.equipment }">
        🃏 {{ game.equipment ? 'Special deck' : 'Standard deck' }}
      </span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Game } from '../types/game'

const NEON_COLORS = [
  'var(--neon-1)', 'var(--neon-2)', 'var(--neon-3)',
  'var(--neon-4)', 'var(--neon-5)', 'var(--neon-6)',
]

const props = defineProps<{
  game: Game
  index: number
}>()

const neonColor = computed(() => NEON_COLORS[props.index % NEON_COLORS.length])

const playerRange = computed(() => {
  if (props.game.playersMin === props.game.playersMax) {
    return `${props.game.playersMin}`
  }
  return `${props.game.playersMin}–${props.game.playersMax}`
})
</script>

<style scoped>
.game-card {
  display: block;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.2s, transform 0.15s;
}

.game-card:hover {
  transform: translateY(-3px);
  border-color: var(--text-secondary);
}

.game-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 10px;
  line-height: 1.3;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  background: var(--border-card);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.chip--highlight {
  color: var(--neon-5);
}
</style>
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npx vitest run src/components/__tests__/GameCard.test.ts
```

Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add GameCard component with neon accent colors"
```

---

## Task 8: `FilterBar` component (TDD)

**Files:**
- Create: `src/components/__tests__/FilterBar.test.ts`
- Create: `src/components/FilterBar.vue`

- [ ] **Step 1: Write failing tests**

```typescript
// src/components/__tests__/FilterBar.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterBar from '../FilterBar.vue'
import type { FilterState } from '../../types/game'

const DEFAULT_FILTERS: FilterState = {
  players: null,
  duration: null,
  category: null,
  equipment: null,
}

describe('FilterBar', () => {
  it('renders player count options including 6+', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('6+')
  })

  it('renders duration options', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('Quick')
    expect(wrapper.text()).toContain('Medium')
    expect(wrapper.text()).toContain('Long')
  })

  it('renders category options', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('Competitive')
    expect(wrapper.text()).toContain('Cooperative')
  })

  it('renders equipment options', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('Standard deck')
    expect(wrapper.text()).toContain('Special equipment')
  })

  it('emits filter-change with key and value when a chip is clicked', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    const quickButton = wrapper.findAll('button').find(b => b.text() === 'Quick')!
    await quickButton.trigger('click')
    expect(wrapper.emitted('filter-change')).toBeTruthy()
    expect(wrapper.emitted('filter-change')![0]).toEqual(['duration', 'quick'])
  })

  it('emits filter-change for player count', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    const btn = wrapper.findAll('button').find(b => b.text() === '3')!
    await btn.trigger('click')
    expect(wrapper.emitted('filter-change')![0]).toEqual(['players', 3])
  })

  it('marks the active filter chip with the "active" class', () => {
    const wrapper = mount(FilterBar, {
      props: { filters: { ...DEFAULT_FILTERS, duration: 'quick' } },
    })
    const quickButton = wrapper.findAll('button').find(b => b.text() === 'Quick')!
    expect(quickButton.classes()).toContain('active')
  })

  it('emits clear event when "Clear all" is clicked', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    await wrapper.find('.clear-btn').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/components/__tests__/FilterBar.test.ts
```

Expected: All tests fail with "Cannot find module '../FilterBar.vue'".

- [ ] **Step 3: Implement `FilterBar.vue`**

```vue
<!-- src/components/FilterBar.vue -->
<template>
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">Players</span>
      <div class="chips">
        <button
          v-for="opt in PLAYER_OPTIONS"
          :key="String(opt.value)"
          class="chip"
          :class="{ active: filters.players === opt.value }"
          @click="emit('filter-change', 'players', opt.value)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <div class="filter-group">
      <span class="filter-label">Duration</span>
      <div class="chips">
        <button
          v-for="opt in DURATION_OPTIONS"
          :key="String(opt.value)"
          class="chip"
          :class="{ active: filters.duration === opt.value }"
          @click="emit('filter-change', 'duration', opt.value)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <div class="filter-group">
      <span class="filter-label">Type</span>
      <div class="chips">
        <button
          v-for="opt in CATEGORY_OPTIONS"
          :key="String(opt.value)"
          class="chip"
          :class="{ active: filters.category === opt.value }"
          @click="emit('filter-change', 'category', opt.value)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <div class="filter-group">
      <span class="filter-label">Equipment</span>
      <div class="chips">
        <button
          v-for="opt in EQUIPMENT_OPTIONS"
          :key="String(opt.value)"
          class="chip"
          :class="{ active: filters.equipment === opt.value }"
          @click="emit('filter-change', 'equipment', opt.value)"
        >{{ opt.label }}</button>
      </div>
    </div>

    <button class="clear-btn" @click="emit('clear')">Clear all</button>
  </div>
</template>

<script setup lang="ts">
import type { FilterState } from '../types/game'

const PLAYER_OPTIONS = [
  { label: 'Any', value: null },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6+', value: 6 },
] as const

const DURATION_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Quick', value: 'quick' },
  { label: 'Medium', value: 'medium' },
  { label: 'Long', value: 'long' },
] as const

const CATEGORY_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Competitive', value: 'competitive' },
  { label: 'Cooperative', value: 'cooperative' },
] as const

const EQUIPMENT_OPTIONS = [
  { label: 'Any', value: null },
  { label: 'Standard deck', value: false },
  { label: 'Special equipment', value: true },
] as const

defineProps<{ filters: FilterState }>()

const emit = defineEmits<{
  'filter-change': [key: keyof FilterState, value: FilterState[keyof FilterState]]
  'clear': []
}>()
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-card);
  align-items: flex-start;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

.chips {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.chip {
  background: var(--bg-primary);
  border: 1px solid var(--border-card);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: border-color 0.15s, color 0.15s;
}

.chip:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

.chip.active {
  border-color: var(--neon-2);
  color: var(--neon-2);
  background: rgba(79, 172, 254, 0.1);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-decoration: underline;
  align-self: flex-end;
  padding: 4px 0;
  transition: color 0.15s;
}

.clear-btn:hover {
  color: var(--text-primary);
}
</style>
```

- [ ] **Step 4: Run tests — confirm they all pass**

```bash
npx vitest run src/components/__tests__/FilterBar.test.ts
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/FilterBar.vue src/components/__tests__/FilterBar.test.ts
git commit -m "feat: add FilterBar component with emit-based filter controls"
```

---

## Task 9: `HomeView`

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: Replace the HomeView stub with the full implementation**

```vue
<!-- src/views/HomeView.vue -->
<template>
  <div class="home">
    <header class="header">
      <h1 class="app-title">🃏 Rainbow Games</h1>
    </header>

    <FilterBar
      :filters="activeFilters"
      @filter-change="handleFilterChange"
      @clear="clearFilters"
    />

    <main class="content">
      <p v-if="filteredGames.length === 0" class="empty-state">
        No games match — try adjusting your filters.
      </p>
      <div v-else class="game-grid">
        <GameCard
          v-for="(game, index) in filteredGames"
          :key="game.slug"
          :game="game"
          :index="index"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useGames } from '../composables/useGames'
import FilterBar from '../components/FilterBar.vue'
import GameCard from '../components/GameCard.vue'
import type { FilterState } from '../types/game'

const { filteredGames, activeFilters, setFilter, clearFilters } = useGames()

function handleFilterChange<K extends keyof FilterState>(key: K, value: FilterState[K]) {
  setFilter(key, value)
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 16px 16px;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(90deg, var(--neon-2), var(--neon-3), var(--neon-4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content {
  flex: 1;
  padding: 16px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.empty-state {
  color: var(--text-secondary);
  text-align: center;
  padding: 60px 16px;
  font-size: 0.9rem;
}
</style>
```

- [ ] **Step 2: Verify it renders in the browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Should show "🃏 Rainbow Games" header, the filter bar, and an empty grid (no games yet — that's expected). Press `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: implement HomeView with filter bar and responsive card grid"
```

---

## Task 10: `GameView`

**Files:**
- Modify: `src/views/GameView.vue`

- [ ] **Step 1: Replace the GameView stub with the full implementation**

```vue
<!-- src/views/GameView.vue -->
<template>
  <div class="game-view">
    <header class="game-header">
      <RouterLink to="/" class="back-btn">← Back</RouterLink>
    </header>

    <div v-if="game" class="game-content">
      <h1 class="game-title" :style="{ color: neonColor }">{{ game.name }}</h1>
      <div class="chips">
        <span class="chip">👥 {{ playerRange }}</span>
        <span class="chip">⏱ {{ game.duration }}</span>
        <span class="chip">{{ game.category === 'competitive' ? '⚔️' : '🤝' }} {{ game.category }}</span>
        <span class="chip">🃏 {{ game.equipment ? 'Special deck' : 'Standard deck' }}</span>
      </div>
      <!-- v-html is safe here — content is authored by the app owner, not user input -->
      <div class="rules prose" v-html="renderedContent" />
    </div>

    <div v-else class="not-found">
      <p>Game not found.</p>
      <RouterLink to="/" class="back-link">← Back to all games</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { useGames } from '../composables/useGames'

const NEON_COLORS = [
  'var(--neon-1)', 'var(--neon-2)', 'var(--neon-3)',
  'var(--neon-4)', 'var(--neon-5)', 'var(--neon-6)',
]

const route = useRoute()
const { games, getGameBySlug } = useGames()
const md = new MarkdownIt()

const game = computed(() => getGameBySlug(route.params.slug as string))

const gameIndex = computed(() =>
  games.findIndex(g => g.slug === (route.params.slug as string))
)

const neonColor = computed(() =>
  NEON_COLORS[Math.max(0, gameIndex.value) % NEON_COLORS.length]
)

const renderedContent = computed(() =>
  game.value ? md.render(game.value.content) : ''
)

const playerRange = computed(() => {
  if (!game.value) return ''
  if (game.value.playersMin === game.value.playersMax) return `${game.value.playersMin}`
  return `${game.value.playersMin}–${game.value.playersMax}`
})
</script>

<style scoped>
.game-view {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 60px;
  min-height: 100vh;
}

.game-header {
  padding: 20px 0 16px;
}

.back-btn {
  color: var(--text-secondary);
  font-size: 0.85rem;
  transition: color 0.15s;
}

.back-btn:hover {
  color: var(--text-primary);
}

.game-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 12px;
  line-height: 1.2;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 32px;
}

.chip {
  background: var(--border-card);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Markdown content styling */
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  color: var(--text-primary);
  margin: 1.5em 0 0.5em;
  font-weight: 700;
}

.prose :deep(h2) { font-size: 1.25rem; }
.prose :deep(h3) { font-size: 1rem; }

.prose :deep(p) {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1em;
}

.prose :deep(ul),
.prose :deep(ol) {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.prose :deep(li) {
  margin-bottom: 0.25em;
}

.prose :deep(strong) {
  color: var(--text-primary);
}

.prose :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-card);
  margin: 2em 0;
}

.not-found {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

.back-link {
  display: inline-block;
  margin-top: 12px;
  color: var(--neon-2);
  font-size: 0.85rem;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/GameView.vue
git commit -m "feat: implement GameView with markdown-it rules rendering"
```

---

## Task 11: Add sample game files

**Files:**
- Create: `src/games/go-fish.md`
- Create: `src/games/snap.md`
- Create: `src/games/rummy.md`

These are sample files to verify the app works end-to-end. Replace with your own full rule sets.

- [ ] **Step 1: Create the games directory and sample files**

```bash
mkdir -p src/games
```

```markdown
---
name: Go Fish
players_min: 2
players_max: 6
duration: quick
category: competitive
equipment: false
---

## Objective

Collect the most sets of four matching cards.

## Setup

Deal 7 cards to each player (5 cards if more than 4 players). Place remaining cards face-down as the draw pile.

## How to Play

On your turn, pick any opponent and ask them for a specific card rank (e.g., "Do you have any threes?"). You must already hold at least one card of that rank.

- **If they have it:** They give you all cards of that rank. Take another turn.
- **If they don't:** They say "Go Fish!" — draw the top card from the pile. Your turn ends.

When you collect all four cards of a rank, place the set face-up in front of you.

## Winning

Play until all cards are in sets. The player with the most sets wins.
```

Save this as `src/games/go-fish.md`.

```markdown
---
name: Snap
players_min: 2
players_max: 8
duration: quick
category: competitive
equipment: false
---

## Objective

Win all the cards.

## Setup

Deal the entire deck evenly among players, face-down. Players do not look at their cards.

## How to Play

Players take turns flipping their top card face-up into a central pile. When two consecutive cards have the same rank, the first player to shout **"Snap!"** wins the entire pile and adds it to the bottom of their hand.

If a player runs out of cards, they are out. The last player with cards wins.

## Snap Pool

If two players call "Snap!" simultaneously, the pile becomes a "Snap Pool" placed to the side. The next time any card matching the top of the pool is played, the first to call "Snap Pool!" wins all cards in the pool.
```

Save as `src/games/snap.md`.

```markdown
---
name: Rummy
players_min: 2
players_max: 6
duration: long
category: competitive
equipment: false
---

## Objective

Be the first to empty your hand by forming all cards into valid **melds**.

## Melds

- **Set:** Three or four cards of the same rank (e.g., 7♠ 7♥ 7♦)
- **Run:** Three or more consecutive cards of the same suit (e.g., 4♣ 5♣ 6♣)

## Setup

Deal 10 cards each (7 for 3–4 players, 6 for 5–6 players). Place remaining cards face-down as the stock; flip one card face-up to start the discard pile.

## How to Play

On your turn:
1. **Draw** the top card from either the stock or discard pile.
2. Optionally **lay down** melds from your hand or **lay off** cards onto existing melds.
3. **Discard** one card to the discard pile.

## Winning

The first player to meld all cards (with a final discard) wins the round. Other players score penalty points for cards left in hand. Play to an agreed total (e.g., 100 points) — lowest score wins.
```

Save as `src/games/rummy.md`.

- [ ] **Step 2: Verify cards appear in the browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Three game cards should appear in the grid. Click one to verify the detail page shows the rules. Press `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add src/games/
git commit -m "feat: add sample card game files (go-fish, snap, rummy)"
```

---

## Task 12: PWA icons

**Files:**
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`

The PWA manifest requires actual PNG files. This task generates simple placeholder icons using a Node.js script. Replace with a proper icon before distribution.

- [ ] **Step 1: Create the icons directory**

```bash
mkdir -p public/icons
```

- [ ] **Step 2: Add icon PNG files**

Copy any two PNG images into `public/icons/`:

```
public/icons/icon-192.png   — any 192×192 PNG (solid color square is fine)
public/icons/icon-512.png   — any 512×512 PNG (solid color square is fine)
```

A quick way to generate minimal placeholders if you have ImageMagick installed:

```bash
magick -size 192x192 xc:#1a1a2e public/icons/icon-192.png
magick -size 512x512 xc:#1a1a2e public/icons/icon-512.png
```

Otherwise, any PNG of the right dimensions will work. Replace with a proper icon before sharing the app.

- [ ] **Step 3: Verify the manifest includes icons**

```bash
npm run build && cat dist/manifest.webmanifest
```

Expected: JSON output containing the `icons` array with `icon-192.png` and `icon-512.png`.

- [ ] **Step 4: Commit**

```bash
git add public/icons/
git commit -m "feat: add placeholder PWA icons"
```

---

## Task 13: Full build verification

**Files:** None — verification only.

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass. Green output. No failures.

- [ ] **Step 2: Run a production build**

```bash
npm run build
```

Expected: `dist/` folder created. No TypeScript errors. No Vite build errors.

- [ ] **Step 3: Preview the production build locally**

```bash
npm run preview
```

Open the printed URL (e.g., `http://localhost:4173`). Verify:
- Home page shows cards with neon names
- Filters narrow the grid correctly
- Clicking a card opens the full rules page
- Back button returns to the grid

- [ ] **Step 4: Check PWA is installable**

In Chrome/Edge, open DevTools → Application → Manifest. Verify:
- App name shows "Rainbow Games"
- Icons are present
- Display mode is "standalone"

In the browser address bar, an install icon (⊕) should appear.

- [ ] **Step 5: Verify offline works**

In DevTools → Network tab, set throttle to "Offline". Reload the page. The app should still load fully (served from service worker cache).

- [ ] **Step 6: Add `.gitignore` entries and final commit**

```bash
echo "\n# PWA brainstorm session\n.superpowers/" >> .gitignore
```

```bash
git add .gitignore
git commit -m "chore: add .superpowers/ to .gitignore"
```

**You're done.** The app is built, tested, and verified as an installable offline PWA.

---

## Adding New Games Later

To add a new game, create `src/games/<slug>.md` with the frontmatter schema:

```markdown
---
name: Your Game Name
players_min: 2
players_max: 4
duration: quick        # quick | medium | long
category: competitive  # competitive | cooperative
equipment: false       # true | false
---

## Your Rules Here

Write in standard Markdown...
```

Then run `npm run build` to rebuild the app. No other changes needed.
