// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'

export const router = createRouter({
  // Hash history works without server configuration — required for static PWA hosting
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/game/:slug', component: GameView },
  ],
})
