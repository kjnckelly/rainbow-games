# Game Ratings Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 0–10 rating system where scores are stored in localStorage, displayed as a rainbow progress bar on home screen cards, set from the game detail page via a dropdown, filterable by minimum score, and exportable/importable as compact YAML.

**Architecture:** A new `useRatings` composable holds module-level singleton state (same pattern as `useGames`). `GameCard` reads ratings for the progress bar. `GameView` writes ratings via a dropdown. `FilterBar` adds a sixth "Rating ≥" dropdown. `HomeView` adds a "Ratings" modal for YAML export/import.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vitest + jsdom, localStorage, CSS

---

## File Map

| File | Change |
|------|--------|
| `src/composables/useRatings.ts` | **New** — singleton ratings state, localStorage read/write, YAML export/import |
| `src/composables/__tests__/useRatings.test.ts` | **New** — unit tests for useRatings |
| `src/types/game.ts` | Add `minRating: number \| null` to `FilterState` |
| `src/composables/useGames.ts` | Import `useRatings`, add `minRating` to `DEFAULT_FILTERS`, add filter condition |
| `src/composables/__tests__/useGames.test.ts` | Add `minRating` filter tests |
| `src/components/GameCard.vue` | Restructure card layout, add rainbow progress bar |
| `src/views/GameView.vue` | Add rating `<select>` below chips |
| `src/components/FilterBar.vue` | Add 6th "Rating ≥" dropdown + handler |
| `src/views/HomeView.vue` | Add "Ratings" button + export/import modal |

---

## Task 1: `useRatings` composable

**Files:**
- Create: `src/composables/useRatings.ts`
- Create: `src/composables/__tests__/useRatings.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/composables/__tests__/useRatings.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useRatings } from '../useRatings'

describe('useRatings', () => {
  beforeEach(() => {
    localStorage.clear()
    useRatings().ratings.value = {}
  })

  it('ratings starts empty when localStorage is clear', () => {
    const { ratings } = useRatings()
    expect(ratings.value).toEqual({})
  })

  it('setRating stores the score and persists to localStorage', () => {
    const { ratings, setRating } = useRatings()
    setRating('6-nimmt', 8)
    expect(ratings.value['6-nimmt']).toBe(8)
    const stored = JSON.parse(localStorage.getItem('rainbow-games-ratings')!)
    expect(stored['6-nimmt']).toBe(8)
  })

  it('setRating updates an existing rating', () => {
    const { ratings, setRating } = useRatings()
    setRating('6-nimmt', 5)
    setRating('6-nimmt', 9)
    expect(ratings.value['6-nimmt']).toBe(9)
  })

  it('exportYaml produces sorted slug: score lines, omitting score-0 entries', () => {
    const { setRating, exportYaml } = useRatings()
    setRating('red7', 6)
    setRating('6-nimmt', 8)
    setRating('the-game', 0)
    expect(exportYaml()).toBe('6-nimmt: 8\nred7: 6')
  })

  it('exportYaml returns empty string when no games are rated', () => {
    const { exportYaml } = useRatings()
    expect(exportYaml()).toBe('')
  })

  it('importYaml merges parsed ratings into existing state', () => {
    const { ratings, setRating, importYaml } = useRatings()
    setRating('6-nimmt', 8)
    importYaml('red7: 6\nno-thanks: 7')
    expect(ratings.value['6-nimmt']).toBe(8)
    expect(ratings.value['red7']).toBe(6)
    expect(ratings.value['no-thanks']).toBe(7)
  })

  it('importYaml persists merged result to localStorage', () => {
    const { importYaml } = useRatings()
    importYaml('6-nimmt: 8')
    const stored = JSON.parse(localStorage.getItem('rainbow-games-ratings')!)
    expect(stored['6-nimmt']).toBe(8)
  })

  it('importYaml silently skips invalid lines', () => {
    const { ratings, importYaml } = useRatings()
    importYaml('6-nimmt: 8\nnot valid\n: 5\nred7: 7')
    expect(ratings.value['6-nimmt']).toBe(8)
    expect(ratings.value['red7']).toBe(7)
    expect(Object.keys(ratings.value)).toHaveLength(2)
  })

  it('importYaml does not change games not mentioned', () => {
    const { ratings, setRating, importYaml } = useRatings()
    setRating('6-nimmt', 8)
    importYaml('red7: 6')
    expect(ratings.value['6-nimmt']).toBe(8)
  })

  it('importYaml is idempotent — re-importing the export produces the same state', () => {
    const { ratings, setRating, exportYaml, importYaml } = useRatings()
    setRating('6-nimmt', 8)
    setRating('red7', 6)
    const yaml = exportYaml()
    importYaml(yaml)
    expect(ratings.value['6-nimmt']).toBe(8)
    expect(ratings.value['red7']).toBe(6)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```
npx vitest run src/composables/__tests__/useRatings.test.ts
```

Expected: all tests fail with "Cannot find module '../useRatings'"

- [ ] **Step 3: Create `src/composables/useRatings.ts`**

```ts
import { ref } from 'vue'

const STORAGE_KEY = 'rainbow-games-ratings'

function loadRatings(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveRatings(data: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable — silently no-op
  }
}

const ratings = ref<Record<string, number>>(loadRatings())

export function useRatings() {
  function setRating(slug: string, score: number): void {
    ratings.value = { ...ratings.value, [slug]: score }
    saveRatings(ratings.value)
  }

  function exportYaml(): string {
    return Object.entries(ratings.value)
      .filter(([, score]) => score > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, score]) => `${slug}: ${score}`)
      .join('\n')
  }

  function importYaml(content: string): void {
    const parsed: Record<string, number> = {}
    for (const line of content.split('\n')) {
      const match = line.match(/^([^:\n]+):\s*(\d+)\s*$/)
      if (match) {
        const score = Number(match[2])
        if (score >= 0 && score <= 10) {
          parsed[match[1].trim()] = score
        }
      }
    }
    ratings.value = { ...ratings.value, ...parsed }
    saveRatings(ratings.value)
  }

  return { ratings, setRating, exportYaml, importYaml }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npx vitest run src/composables/__tests__/useRatings.test.ts
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/composables/useRatings.ts src/composables/__tests__/useRatings.test.ts
git commit -m "feat: add useRatings composable with localStorage persistence and YAML export/import"
```

---

## Task 2: `minRating` filter in types and `useGames`

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/composables/useGames.ts`
- Modify: `src/composables/__tests__/useGames.test.ts`

- [ ] **Step 1: Write failing tests for `minRating` filter**

At the top of `src/composables/__tests__/useGames.test.ts`, add the `useRatings` import after the existing import:

```ts
import { useRatings } from '../useRatings'
```

At the bottom of the file, inside the `describe('useGames', ...)` block, add a nested describe:

```ts
describe('minRating filter', () => {
  beforeEach(() => {
    localStorage.clear()
    useRatings().ratings.value = {}
  })

  it('null minRating shows all games regardless of rating', () => {
    const { filteredGames } = useGames(MOCK_MODULES)
    expect(filteredGames.value).toHaveLength(3)
  })

  it('minRating excludes games rated below the threshold', () => {
    const { setRating } = useRatings()
    setRating('go-fish', 3)
    setRating('rummy', 7)
    // hanabi has no rating (0)
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('minRating', 5)
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Rummy')
  })

  it('minRating excludes unplayed games (rating 0)', () => {
    const { setRating } = useRatings()
    setRating('go-fish', 8)
    // rummy and hanabi are unplayed (0)
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('minRating', 1)
    expect(filteredGames.value).toHaveLength(1)
    expect(filteredGames.value[0].name).toBe('Go Fish')
  })

  it('minRating includes games exactly at the threshold', () => {
    const { setRating } = useRatings()
    setRating('go-fish', 5)
    setRating('rummy', 5)
    const { filteredGames, setFilter } = useGames(MOCK_MODULES)
    setFilter('minRating', 5)
    expect(filteredGames.value).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```
npx vitest run src/composables/__tests__/useGames.test.ts
```

Expected: new `minRating filter` tests fail — `setFilter` rejects `'minRating'` since it's not yet on `FilterState`.

- [ ] **Step 3: Add `minRating` to `FilterState` in `src/types/game.ts`**

Replace the `FilterState` interface:

```ts
export interface FilterState {
  players: PlayerFilter
  duration: DurationFilter
  category: CategoryFilter
  equipment: EquipmentFilter
  deck: DeckFilter
  minRating: number | null
}
```

- [ ] **Step 4: Update `src/composables/useGames.ts`**

Add import at the top (after the existing imports):

```ts
import { useRatings } from './useRatings'
```

After the `DEFAULT_RAW_MODULES` block at module level (after the `ALL_GAMES` line), add:

```ts
const { ratings } = useRatings()
```

Update `DEFAULT_FILTERS` to include the new field:

```ts
const DEFAULT_FILTERS: FilterState = {
  players: null,
  duration: null,
  category: null,
  equipment: null,
  deck: null,
  minRating: null,
}
```

In the `filteredGames` computed, add a new condition after the `deck` check (before `return true`):

```ts
if (f.minRating !== null) {
  const r = ratings.value[game.slug] ?? 0
  if (r < f.minRating) return false
}
```

- [ ] **Step 5: Run tests to verify they pass**

```
npx vitest run src/composables/__tests__/useGames.test.ts
```

Expected: all tests (existing 12 + new 4) pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/game.ts src/composables/useGames.ts src/composables/__tests__/useGames.test.ts
git commit -m "feat: add minRating filter to FilterState and useGames"
```

---

## Task 3: `GameCard` rainbow progress bar

**Files:**
- Modify: `src/components/GameCard.vue`

The card currently has `padding: 16px` on the outer `<RouterLink>`. The bar must be flush with the card edges (outside the padding), so the content needs to move into an inner div.

- [ ] **Step 1: Replace the entire `<template>` section**

```html
<template>
  <RouterLink :to="`/game/${game.slug}`" class="game-card">
    <div class="game-card-body">
      <h3 class="game-name" :style="{ color: neonColor }">{{ game.name }}</h3>
      <div class="chips">
        <span class="chip">👥 {{ playerRange }}</span>
        <span class="chip">⏱ {{ game.duration }}</span>
        <span class="chip">{{ game.category === 'competitive' ? '⚔️' : '🤝' }} {{ game.category }}</span>
        <span class="chip" :class="{ 'chip--highlight': game.equipment }">
          🃏 {{ game.equipment ? 'Special deck' : 'Standard deck' }}
        </span>
      </div>
    </div>
    <div class="rating-bar">
      <div v-if="rating > 0" class="rating-fill" :style="ratingFillStyle" />
    </div>
  </RouterLink>
</template>
```

- [ ] **Step 2: Replace the entire `<script setup>` section**

```ts
<script setup lang="ts">
import { computed } from 'vue'
import type { Game } from '../types/game'
import { useRatings } from '../composables/useRatings'

const NEON_COLORS = [
  'var(--neon-1)', 'var(--neon-2)', 'var(--neon-3)',
  'var(--neon-4)', 'var(--neon-5)', 'var(--neon-6)',
]

const props = defineProps<{
  game: Game
  index: number
}>()

const { ratings } = useRatings()

const neonColor = computed(() => NEON_COLORS[props.index % NEON_COLORS.length])

const playerRange = computed(() => {
  if (props.game.playersMin === props.game.playersMax) {
    return `${props.game.playersMin}`
  }
  return `${props.game.playersMin}–${props.game.playersMax}`
})

const rating = computed(() => ratings.value[props.game.slug] ?? 0)

const ratingFillStyle = computed(() => ({
  width: `${rating.value * 10}%`,
  backgroundSize: `${Math.round(1000 / rating.value)}% 100%`,
}))
</script>
```

- [ ] **Step 3: Replace the entire `<style scoped>` section**

```css
<style scoped>
.game-card {
  display: block;
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s;
}

.game-card:hover {
  transform: translateY(-3px);
  border-color: var(--text-secondary);
}

.game-card-body {
  padding: 16px;
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

.rating-bar {
  height: 4px;
  background: #2d3748;
  position: relative;
}

.rating-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(to right, #e94560, #ffa751, #f9ca24, #43e97b);
}
</style>
```

- [ ] **Step 4: Run full test suite to verify no regressions**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/GameCard.vue
git commit -m "feat: add rainbow rating progress bar to GameCard"
```

---

## Task 4: `GameView` rating dropdown

**Files:**
- Modify: `src/views/GameView.vue`

- [ ] **Step 1: Add `useRatings` import and computed/handler to `<script setup>`**

The existing `<script setup>` already imports `computed` from `'vue'`. Add after the existing imports:

```ts
import { useRatings } from '../composables/useRatings'

const { ratings, setRating } = useRatings()

const currentRating = computed(() => ratings.value[slug.value] ?? 0)

function onRatingChange(e: Event) {
  const score = Number((e.target as HTMLSelectElement).value)
  setRating(slug.value, score)
}
```

- [ ] **Step 2: Add rating dropdown to the template**

In the `<div v-if="game" class="game-content">` block, add the rating control between the closing `</div>` of `.chips` and the `<div class="rules prose"...>`:

```html
<div class="rating-control">
  <label class="filter-label" for="game-rating">Your Rating</label>
  <select
    id="game-rating"
    class="filter-select"
    :class="{ active: currentRating > 0 }"
    :value="currentRating"
    @change="onRatingChange"
  >
    <option value="0">Unplayed</option>
    <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
  </select>
</div>
```

- [ ] **Step 3: Update CSS in `<style scoped>`**

The existing `.chips` has `margin-bottom: 32px`. Change it to `margin-bottom: 12px` so the spacing goes between chips and the rating control, not before the rules:

```css
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
```

Add new rules:

```css
.rating-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 32px;
  max-width: 160px;
}

.filter-label {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}

.filter-select {
  background: var(--bg-primary);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 0.8rem;
  color: var(--text-primary);
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--neon-2);
}

.filter-select.active {
  border-color: var(--neon-2);
  color: var(--neon-2);
}
```

- [ ] **Step 4: Run full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/views/GameView.vue
git commit -m "feat: add rating dropdown to game detail page"
```

---

## Task 5: `FilterBar` "Rating ≥" dropdown

**Files:**
- Modify: `src/components/FilterBar.vue`

- [ ] **Step 1: Add the dropdown to the template**

In `FilterBar.vue`, add a new `filter-group` div immediately before the `<button class="clear-btn"...>` line:

```html
<div class="filter-group">
  <label class="filter-label" for="f-rating">Rating ≥</label>
  <select
    id="f-rating"
    class="filter-select"
    :class="{ active: filters.minRating !== null }"
    :value="filters.minRating ?? ''"
    @change="onMinRating"
  >
    <option value="">Any</option>
    <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
  </select>
</div>
```

- [ ] **Step 2: Add `onMinRating` handler to `<script setup>`**

Add after the `onDeck` function:

```ts
function onMinRating(e: Event) {
  const v = val(e)
  emit('filter-change', 'minRating', v === '' ? null : Number(v) as FilterState['minRating'])
}
```

- [ ] **Step 3: Run full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/FilterBar.vue
git commit -m "feat: add Rating ≥ filter dropdown to FilterBar"
```

---

## Task 6: HomeView "Ratings" button and export/import modal

**Files:**
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: Add imports and modal state to `<script setup>`**

`HomeView.vue` currently has no `vue` import. Add at the top of `<script setup>`:

```ts
import { ref, watch } from 'vue'
import { useRatings } from '../composables/useRatings'

const { exportYaml, importYaml } = useRatings()

const showRatingsModal = ref(false)
const ratingsYaml = ref('')

watch(showRatingsModal, (open) => {
  if (open) ratingsYaml.value = exportYaml()
})

async function copyRatings() {
  try {
    await navigator.clipboard.writeText(ratingsYaml.value)
  } catch {
    const el = document.getElementById('ratings-textarea') as HTMLTextAreaElement | null
    el?.select()
  }
}

function saveRatings() {
  importYaml(ratingsYaml.value)
  showRatingsModal.value = false
}
```

- [ ] **Step 2: Update the template**

Replace the existing `<header class="header">` block with:

```html
<header class="header">
  <h1 id="page-title" class="app-title">🃏 Rainbow Games</h1>
  <button class="ratings-btn" @click="showRatingsModal = true">Ratings</button>
</header>
```

Before the closing `</div>` of the root `.home` div, add the modal:

```html
<div v-if="showRatingsModal" class="modal-overlay" @click.self="showRatingsModal = false">
  <div class="modal">
    <h2 class="modal-title">My Ratings</h2>
    <textarea
      id="ratings-textarea"
      class="ratings-textarea"
      v-model="ratingsYaml"
      placeholder="No ratings yet. Rate some games and they'll appear here."
    />
    <div class="modal-actions">
      <button class="modal-btn" @click="copyRatings">Copy</button>
      <button class="modal-btn modal-btn--primary" @click="saveRatings">Save</button>
      <button class="modal-btn" @click="showRatingsModal = false">Close</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Update CSS in `<style scoped>`**

Replace the existing `.header` rule with a version that includes flex layout:

```css
.header {
  padding: 20px 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

Add new rules:

```css
.ratings-btn {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: underline;
  padding: 4px 8px;
  transition: color 0.15s;
  flex-shrink: 0;
}

.ratings-btn:hover {
  color: var(--text-primary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.ratings-textarea {
  background: var(--bg-primary);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 0.85rem;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.5;
}

.ratings-textarea:focus {
  outline: none;
  border-color: var(--neon-2);
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-btn {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: underline;
  padding: 6px 12px;
  transition: color 0.15s;
}

.modal-btn:hover {
  color: var(--text-primary);
}

.modal-btn--primary {
  color: var(--neon-2);
}

.modal-btn--primary:hover {
  color: var(--text-primary);
}
```

- [ ] **Step 4: Run full test suite**

```
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Build to verify no TypeScript errors**

```
npm run build
```

Expected: exits cleanly with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: add Ratings modal with YAML export/import to home screen"
```
