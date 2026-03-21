<template>
  <div class="filter-bar">
    <div class="filter-group">
      <label class="filter-label" for="f-players">Players</label>
      <select id="f-players" class="filter-select" :class="{ active: filters.players !== null }" :value="playersStr" @change="onPlayers">
        <option value="">Any</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6+</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label" for="f-duration">Duration</label>
      <select id="f-duration" class="filter-select" :class="{ active: filters.duration !== null }" :value="filters.duration ?? ''" @change="onDuration">
        <option value="">Any</option>
        <option value="quick">Quick</option>
        <option value="medium">Medium</option>
        <option value="long">Long</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label" for="f-type">Type</label>
      <select id="f-type" class="filter-select" :class="{ active: filters.category !== null }" :value="filters.category ?? ''" @change="onCategory">
        <option value="">Any</option>
        <option value="competitive">Competitive</option>
        <option value="cooperative">Cooperative</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label" for="f-equipment">Equipment</label>
      <select id="f-equipment" class="filter-select" :class="{ active: filters.equipment !== null }" :value="equipmentStr" @change="onEquipment">
        <option value="">Any</option>
        <option value="false">Cards only</option>
        <option value="true">Chips + Dice</option>
      </select>
    </div>

    <div class="filter-group">
      <label class="filter-label" for="f-deck">Deck</label>
      <select id="f-deck" class="filter-select" :class="{ active: filters.deck !== null }" :value="filters.deck ?? ''" @change="onDeck">
        <option value="">Any</option>
        <option value="rainbow">Rainbow</option>
        <option value="face">Face</option>
      </select>
    </div>

    <button class="clear-btn" @click="emit('clear')">Clear</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FilterState } from '../types/game'

const props = defineProps<{ filters: FilterState }>()

const emit = defineEmits<{
  'filter-change': [key: keyof FilterState, value: FilterState[keyof FilterState]]
  'clear': []
}>()

const playersStr = computed(() => props.filters.players === null ? '' : String(props.filters.players))
const equipmentStr = computed(() => props.filters.equipment === null ? '' : String(props.filters.equipment))

function val(e: Event) {
  return (e.target as HTMLSelectElement).value
}

function onPlayers(e: Event) {
  const v = val(e)
  emit('filter-change', 'players', v === '' ? null : Number(v) as FilterState['players'])
}

function onDuration(e: Event) {
  const v = val(e)
  emit('filter-change', 'duration', v === '' ? null : v as FilterState['duration'])
}

function onCategory(e: Event) {
  const v = val(e)
  emit('filter-change', 'category', v === '' ? null : v as FilterState['category'])
}

function onEquipment(e: Event) {
  const v = val(e)
  emit('filter-change', 'equipment', v === '' ? null : v === 'true')
}

function onDeck(e: Event) {
  const v = val(e)
  emit('filter-change', 'deck', v === '' ? null : v as FilterState['deck'])
}
</script>

<style scoped>
.filter-bar {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px 10px;
  padding: 12px 16px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-card);
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  width: 100%;
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

.clear-btn {
  align-self: end;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-decoration: underline;
  padding: 6px 0;
  transition: color 0.15s;
}

.clear-btn:hover {
  color: var(--text-primary);
}
</style>
