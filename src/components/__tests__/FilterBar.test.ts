import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterBar from '../FilterBar.vue'
import type { FilterState } from '../../types/game'

const DEFAULT_FILTERS: FilterState = {
  players: null,
  duration: null,
  category: null,
  equipment: null,
}

describe('FilterBar', () => {
  it('renders player count options including 6+', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('6+')
  })

  it('renders duration options', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('Quick')
    expect(wrapper.text()).toContain('Medium')
    expect(wrapper.text()).toContain('Long')
  })

  it('renders category options', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('Competitive')
    expect(wrapper.text()).toContain('Cooperative')
  })

  it('renders equipment options', () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    expect(wrapper.text()).toContain('Cards only')
    expect(wrapper.text()).toContain('Chips + Dice')
  })

  it('emits filter-change with key and value when a chip is clicked', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    const quickButton = wrapper.findAll('button').find(b => b.text() === 'Quick')!
    await quickButton.trigger('click')
    expect(wrapper.emitted('filter-change')).toBeTruthy()
    expect(wrapper.emitted('filter-change')![0]).toEqual(['duration', 'quick'])
  })

  it('emits filter-change for player count', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    const btn = wrapper.findAll('button').find(b => b.text() === '3')!
    await btn.trigger('click')
    expect(wrapper.emitted('filter-change')![0]).toEqual(['players', 3])
  })

  it('marks the active filter chip with the "active" class', () => {
    const wrapper = mount(FilterBar, {
      props: { filters: { ...DEFAULT_FILTERS, duration: 'quick' } },
    })
    const quickButton = wrapper.findAll('button').find(b => b.text() === 'Quick')!
    expect(quickButton.classes()).toContain('active')
  })

  it('emits clear event when "Clear all" is clicked', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    await wrapper.find('.clear-btn').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })
})
