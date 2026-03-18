<template>
  <div class="game-view">
    <header class="game-header">
      <RouterLink to="/" class="back-btn" aria-label="Back to all games">← Back</RouterLink>
    </header>

    <div v-if="game" class="game-content">
      <h1 class="game-title" :style="{ color: neonColor }">{{ game.name }}</h1>
      <div class="chips">
        <span class="chip">👥 {{ playerRange }}</span>
        <span class="chip">⏱ {{ game.duration }}</span>
        <span class="chip">{{ game.category === 'competitive' ? '⚔️' : '🤝' }} {{ game.category }}</span>
        <span class="chip">🃏 {{ game.equipment ? 'Special deck' : 'Standard deck' }}</span>
      </div>
      <!-- v-html is safe here — content is authored by the app owner, not user input -->
      <div class="rules prose" v-html="renderedContent" />
    </div>

    <div v-else class="not-found">
      <p>Game not found.</p>
      <RouterLink to="/" class="back-link">← Back to all games</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { useGames } from '../composables/useGames'

const NEON_COLORS = [
  'var(--neon-1)', 'var(--neon-2)', 'var(--neon-3)',
  'var(--neon-4)', 'var(--neon-5)', 'var(--neon-6)',
]

const route = useRoute()
const slug = computed(() =>
  Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
)
const { games, getGameBySlug } = useGames()
const md = new MarkdownIt()

const game = computed(() => getGameBySlug(slug.value))

const gameIndex = computed(() =>
  games.findIndex(g => g.slug === slug.value)
)

const neonColor = computed(() =>
  NEON_COLORS[Math.max(0, gameIndex.value) % NEON_COLORS.length]
)

const renderedContent = computed(() =>
  game.value ? md.render(game.value.content) : ''
)

const playerRange = computed(() => {
  if (!game.value) return ''
  if (game.value.playersMin === game.value.playersMax) return `${game.value.playersMin}`
  return `${game.value.playersMin}–${game.value.playersMax}`
})
</script>

<style scoped>
.game-view {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 60px;
  min-height: 100vh;
}

.game-header {
  padding: 20px 0 16px;
}

.back-btn {
  color: var(--text-secondary);
  font-size: 0.85rem;
  transition: color 0.15s;
}

.back-btn:hover {
  color: var(--text-primary);
}

.game-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 12px;
  line-height: 1.2;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 32px;
}

.chip {
  background: var(--border-card);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Markdown content styling */
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  color: var(--text-primary);
  margin: 1.5em 0 0.5em;
  font-weight: 700;
}

.prose :deep(h2) { font-size: 1.25rem; }
.prose :deep(h3) { font-size: 1rem; }

.prose :deep(p) {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1em;
}

.prose :deep(ul),
.prose :deep(ol) {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1em;
  padding-left: 1.5em;
}

.prose :deep(li) {
  margin-bottom: 0.25em;
}

.prose :deep(strong) {
  color: var(--text-primary);
}

.prose :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-card);
  margin: 2em 0;
}

.not-found {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
}

.back-link {
  display: inline-block;
  margin-top: 12px;
  color: var(--neon-2);
  font-size: 0.85rem;
}
</style>
