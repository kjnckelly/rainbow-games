// src/types/game.ts

export interface Game {
  slug: string
  name: string
  playersMin: number
  playersMax: number
  duration: 'quick' | 'medium' | 'long'
  category: 'competitive' | 'cooperative'
  equipment: boolean
  deck: 'rainbow' | 'face'
  content: string  // raw Markdown body
}

export type PlayerFilter = 2 | 3 | 4 | 5 | 6 | null  // 6 means "6+", null means "any"
export type DurationFilter = 'quick' | 'medium' | 'long' | null
export type CategoryFilter = 'competitive' | 'cooperative' | null
export type EquipmentFilter = boolean | null  // true = needs equipment, false = standard, null = any
export type DeckFilter = 'rainbow' | 'face' | null

export interface FilterState {
  players: PlayerFilter
  duration: DurationFilter
  category: CategoryFilter
  equipment: EquipmentFilter
  deck: DeckFilter
}
