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
