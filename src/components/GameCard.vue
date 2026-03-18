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
  return `${props.game.playersMin}\u2013${props.game.playersMax}`
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
