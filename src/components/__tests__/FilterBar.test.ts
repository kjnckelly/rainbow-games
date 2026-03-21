import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterBar from '../FilterBar.vue'
import type { FilterState } from '../../types/game'

const DEFAULT_FILTERS: FilterState = {
  players: null,
  duration: null,
  category: null,
  equipment: null,
  deck: null,
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

  it('emits filter-change with key and value when a select changes', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    await wrapper.find('#f-duration').setValue('quick')
    expect(wrapper.emitted('filter-change')).toBeTruthy()
    expect(wrapper.emitted('filter-change')![0]).toEqual(['duration', 'quick'])
  })

  it('emits filter-change for player count as a number', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    await wrapper.find('#f-players').setValue('3')
    expect(wrapper.emitted('filter-change')![0]).toEqual(['players', 3])
  })

  it('marks the active select with the "active" class when a filter is set', () => {
    const wrapper = mount(FilterBar, {
      props: { filters: { ...DEFAULT_FILTERS, duration: 'quick' } },
    })
    expect(wrapper.find('#f-duration').classes()).toContain('active')
    expect(wrapper.find('#f-players').classes()).not.toContain('active')
  })

  it('emits clear event when "Clear" is clicked', async () => {
    const wrapper = mount(FilterBar, { props: { filters: DEFAULT_FILTERS } })
    await wrapper.find('.clear-btn').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })
})
