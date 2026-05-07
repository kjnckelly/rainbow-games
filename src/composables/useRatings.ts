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
