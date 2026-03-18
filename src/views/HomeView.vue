<template>
  <div class="home">
    <header class="header">
      <h1 class="app-title">🃏 Rainbow Games</h1>
    </header>

    <FilterBar
      :filters="activeFilters"
      @filter-change="handleFilterChange"
      @clear="clearFilters"
    />

    <main class="content">
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
  </div>
</template>

<script setup lang="ts">
import { useGames } from '../composables/useGames'
import FilterBar from '../components/FilterBar.vue'
import GameCard from '../components/GameCard.vue'
import type { FilterState } from '../types/game'

const { filteredGames, activeFilters, setFilter, clearFilters } = useGames()

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
</style>
