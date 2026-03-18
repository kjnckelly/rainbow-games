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
