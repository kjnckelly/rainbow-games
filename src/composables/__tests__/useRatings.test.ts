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
