import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory } from 'vue-router'
import GameCard from '../GameCard.vue'
import type { Game } from '../../types/game'

const TEST_GAME: Game = {
  slug: 'go-fish',
  name: 'Go Fish',
  playersMin: 2,
  playersMax: 5,
  duration: 'quick',
  category: 'competitive',
  equipment: false,
  deck: 'rainbow',
  content: '## Rules\nAsk for cards.',
}

const TEST_GAME_EQUAL_PLAYERS: Game = {
  ...TEST_GAME,
  slug: 'war',
  name: 'War',
  playersMin: 2,
  playersMax: 2,
}

// Router is required because GameCard uses <RouterLink>
const router = createRouter({ history: createWebHashHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })

describe('GameCard', () => {
  it('renders the game name', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('Go Fish')
  })

  it('links to the correct game route', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.find('a').attributes('href')).toContain('go-fish')
  })

  it('shows player range as "min–max" when min differs from max', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('2\u20135')
  })

  it('shows single player count when min equals max', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME_EQUAL_PLAYERS, index: 0 },
    })
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).not.toContain('2\u20132')
  })

  it('shows duration chip', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('quick')
  })

  it('shows category chip', () => {
    const wrapper = mount(GameCard, {
      global: { plugins: [router] },
      props: { game: TEST_GAME, index: 0 },
    })
    expect(wrapper.text()).toContain('competitive')
  })

  it('assigns neon color based on index (cycles through 6 colors)', () => {
    const wrapper0 = mount(GameCard, { global: { plugins: [router] }, props: { game: TEST_GAME, index: 0 } })
    const wrapper6 = mount(GameCard, { global: { plugins: [router] }, props: { game: TEST_GAME, index: 6 } })
    const color0 = wrapper0.find('.game-name').attributes('style')
    const color6 = wrapper6.find('.game-name').attributes('style')
    expect(color0).toBe(color6)  // index 0 and 6 use same color (cycles)
  })
})
