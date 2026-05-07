# Game Ratings Feature — Design Spec

**Date:** 2026-05-06

## Context

Rainbow Games is a static card game rules reference. Users want to track which games they've played and how much they enjoyed them. This spec describes a local, offline-first rating system: scores stored in localStorage, visible on game cards, settable from the game detail page, filterable on the home screen, and exportable/importable as compact YAML.

---

## Architecture

### `src/composables/useRatings.ts` (new)

A new composable — mirroring the existing `useGames` pattern — that owns all rating state.

**State:**
- `ratings: Ref<Record<string, number>>` — map of slug → score (0–10). 0 means unplayed.

**Initialization:** Reads from `localStorage` key `rainbow-games-ratings` on module load. Defaults to `{}` if not found.

**Exports:**
- `ratings` — the reactive ref (read by `GameCard`, `GameView`, `useGames` filter)
- `setRating(slug: string, score: number): void` — updates `ratings[slug]` and writes the full map back to localStorage immediately
- `exportYaml(): string` — serializes ratings to compact YAML (`slug: score\n` lines, sorted by slug, skipping score 0)
- `importYaml(content: string): void` — parses `key: value` lines with a regex split, merges into `ratings`, persists to localStorage. Invalid lines are silently skipped. Games not mentioned in the import are left unchanged.

**No external YAML library** — the format is simple enough to parse without one.

---

## Data / Types

`src/types/game.ts` gets one new filter field:

```ts
// existing FilterState
minRating: number | null   // null = no filter; 1–10 = show only games rated ≥ this value
```

`useGames` filter logic in `src/composables/useGames.ts` adds one new condition: if `minRating` is set, exclude games whose rating (from `useRatings`) is less than `minRating`. Unplayed games (rating 0) are excluded when any `minRating` is active.

---

## UI Changes

### `src/components/GameCard.vue`

A 4px bar is added flush to the bottom of every card (via `overflow: hidden` on the card container).

- **Unplayed (0):** solid `#2d3748` (matches existing card border color — effectively invisible)
- **Rated 1–10:** a filled portion `width: rating * 10%` using a rainbow gradient. The gradient always spans the full card width regardless of fill amount, achieved with `background-size: (1000 / rating)% 100%` (e.g. rating 1 → `1000% 100%`, rating 5 → `200% 100%`, rating 10 → `100% 100%`). This means rating 1 (10% fill) shows only red; rating 10 (100% fill) shows the full rainbow.

Gradient stops: `linear-gradient(to right, #e94560, #ffa751, #f9ca24, #43e97b)`

The bar is purely visual — no label or text appears on the card.

`GameCard` calls `useRatings()` to read the rating for its slug.

### `src/views/GameView.vue`

A rating `<select>` is added below the metadata chips. Styled identically to the filter dropdowns in `FilterBar.vue` (same CSS class, neon border when a non-zero value is active).

Options:
```
Unplayed   (value: 0)
1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```

On change: calls `setRating(slug, value)` from `useRatings`. Updates persist to localStorage immediately and the home screen card bar updates reactively.

### `src/components/FilterBar.vue`

A sixth dropdown is added: label **"Rating ≥"**, options: `Any, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10`.

Selecting a value sets `minRating` in `activeFilters`. Selecting "Any" sets it to `null`. The neon-border active state applies the same way as the existing five filters.

### `src/views/HomeView.vue` — Ratings modal

A small **"Ratings"** button is added to the home screen header. Clicking it opens a modal overlay.

**Modal contents:**
- A `<textarea>` pre-filled with `useRatings().exportYaml()` output when opened
- **Copy** button — writes textarea content to clipboard via `navigator.clipboard.writeText`
- **Save** button — calls `importYaml(textarea value)`, then closes the modal
- Dismiss by clicking outside the modal or a close button

**YAML format:**
```yaml
6-nimmt: 8
no-thanks: 7
schotten-totten: 10
```
Only rated games (score > 0) appear in the export. Unplayed games are omitted.

---

## Error Handling

- `localStorage` unavailable (private browsing, quota exceeded): `setRating` and `importYaml` silently no-op; the app remains functional with in-memory ratings only.
- Malformed YAML on import: invalid lines are skipped; valid lines are applied.
- Clipboard API unavailable: the Copy button falls back to selecting the textarea text so the user can copy manually.

---

## Testing

- Unit tests for `useRatings` in `src/composables/__tests__/useRatings.test.ts`:
  - `setRating` persists to localStorage and updates the ref
  - `exportYaml` serializes correctly, omits score-0 entries
  - `importYaml` merges correctly, skips invalid lines, leaves unmentioned games unchanged
  - `importYaml` is idempotent when re-importing the same export
- `useGames` filter tests: extend existing test suite with `minRating` filter cases
- `GameCard` and `GameView` component tests: verify rating bar renders at correct width, verify dropdown reflects current rating

---

## Files Changed

| File | Change |
|------|--------|
| `src/composables/useRatings.ts` | **New** — ratings state, localStorage, export/import |
| `src/composables/useGames.ts` | Add `minRating` filter condition |
| `src/types/game.ts` | Add `minRating: number \| null` to `FilterState` |
| `src/components/GameCard.vue` | Add rainbow progress bar |
| `src/views/GameView.vue` | Add rating dropdown |
| `src/components/FilterBar.vue` | Add "Rating ≥" dropdown |
| `src/views/HomeView.vue` | Add "Ratings" button + export/import modal |
| `src/composables/__tests__/useRatings.test.ts` | **New** — unit tests |
