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
  return `${props.game.playersMin}\u2013${props.game.playersMax}`
})

const rating = computed(() => ratings.value[props.game.slug] ?? 0)

const ratingFillStyle = computed(() => {
  if (rating.value === 0) return {}
  return {
    width: `${rating.value * 10}%`,
    backgroundSize: `${Math.round(1000 / rating.value)}% 100%`,
  }
})
</script>

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
