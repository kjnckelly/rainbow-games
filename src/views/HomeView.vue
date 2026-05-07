<template>
  <div class="home">
    <header class="header">
      <h1 id="page-title" class="app-title">🃏 Rainbow Games</h1>
      <button class="ratings-btn" @click="showRatingsModal = true">Ratings</button>
    </header>

    <FilterBar
      :filters="activeFilters"
      @filter-change="handleFilterChange"
      @clear="clearFilters"
    />

    <main class="content" aria-labelledby="page-title">
      <p v-if="filteredGames.length === 0" class="empty-state">
        No games match — try adjusting your filters.
      </p>
      <div v-else class="game-grid">
        <GameCard
          v-for="(game, index) in filteredGames"
          :key="game.slug"
          :game="game"
          :index="index"
        />
      </div>
    </main>

    <div v-if="showRatingsModal" class="modal-overlay" @click.self="showRatingsModal = false">
      <div class="modal">
        <h2 class="modal-title">My Ratings</h2>
        <textarea
          id="ratings-textarea"
          class="ratings-textarea"
          v-model="ratingsYaml"
          placeholder="No ratings yet. Rate some games and they'll appear here."
        />
        <div class="modal-actions">
          <button class="modal-btn" @click="copyRatings">Copy</button>
          <button class="modal-btn modal-btn--primary" @click="saveRatings">Save</button>
          <button class="modal-btn" @click="showRatingsModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGames } from '../composables/useGames'
import { useRatings } from '../composables/useRatings'
import FilterBar from '../components/FilterBar.vue'
import GameCard from '../components/GameCard.vue'
import type { FilterState } from '../types/game'

const { filteredGames, activeFilters, setFilter, clearFilters } = useGames()
const { exportYaml, importYaml } = useRatings()

const showRatingsModal = ref(false)
const ratingsYaml = ref('')

watch(showRatingsModal, (open) => {
  if (open) ratingsYaml.value = exportYaml()
})

async function copyRatings() {
  try {
    await navigator.clipboard.writeText(ratingsYaml.value)
  } catch {
    const el = document.getElementById('ratings-textarea') as HTMLTextAreaElement | null
    el?.select()
  }
}

function saveRatings() {
  importYaml(ratingsYaml.value)
  showRatingsModal.value = false
}

function handleFilterChange<K extends keyof FilterState>(key: K, value: FilterState[K]) {
  setFilter(key, value)
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(90deg, var(--neon-2), var(--neon-3), var(--neon-4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content {
  flex: 1;
  padding: 16px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.empty-state {
  color: var(--text-secondary);
  text-align: center;
  padding: 60px 16px;
  font-size: 0.9rem;
}

.ratings-btn {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: underline;
  padding: 4px 8px;
  transition: color 0.15s;
  flex-shrink: 0;
}

.ratings-btn:hover {
  color: var(--text-primary);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: var(--bg-card);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.ratings-textarea {
  background: var(--bg-primary);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 0.85rem;
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  resize: vertical;
  min-height: 160px;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.5;
}

.ratings-textarea:focus {
  outline: none;
  border-color: var(--neon-2);
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.modal-btn {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: underline;
  padding: 6px 12px;
  transition: color 0.15s;
}

.modal-btn:hover {
  color: var(--text-primary);
}

.modal-btn--primary {
  color: var(--neon-2);
}

.modal-btn--primary:hover {
  color: var(--text-primary);
}
</style>
