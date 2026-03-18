import { ref, computed } from 'vue'
import matter from 'gray-matter'
import type { Game, FilterState } from '../types/game'

// Module-level: parse once at startup (not on every composable call)
const DEFAULT_RAW_MODULES = import.meta.glob('../games/*.md', {
  query: '?raw',
  import: 'default',
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
