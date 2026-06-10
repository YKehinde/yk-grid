import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { NumberFilter } from '../ui/NumberFilter'

function renderFilter(props: Partial<React.ComponentProps<typeof NumberFilter>> = {}) {
  const onChange = vi.fn()
  const utils = render(
    <NumberFilter
      columnHeader="Amount"
      value={null}
      operator={null}
      onChange={onChange}
      {...props}
    />,
  )
  return { ...utils, onChange }
}

describe('NumberFilter', () => {
  describe('operator picker', () => {
    it('shows the = symbol by default', () => {
      renderFilter()
      expect(screen.getByRole('button', { name: /Filter operator: Equals/ })).toBeDefined()
    })

    it('opens the operator menu when the button is clicked', () => {
      renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      expect(screen.getByRole('listbox')).toBeDefined()
    })

    it('lists all 6 operator options', () => {
      renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(6)
    })

    it('closes the menu after selecting an operator', () => {
      renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      const options = screen.getAllByRole('option')
      fireEvent.click(options[1]) // Greater than
      expect(screen.queryByRole('listbox')).toBeNull()
    })

    it('updates the operator button symbol after selection', () => {
      renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      const gtOption = screen.getAllByRole('option')[1]
      fireEvent.click(gtOption)
      expect(screen.getByRole('button', { name: /Greater than/ })).toBeDefined()
    })
  })

  describe('single value input', () => {
    it('renders one input for eq operator', () => {
      renderFilter()
      expect(screen.getAllByRole('spinbutton')).toHaveLength(1)
    })

    it('calls onChange with the number value after debounce', async () => {
      vi.useFakeTimers()
      const { onChange } = renderFilter()
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '42' } })
      await act(async () => { vi.runAllTimers() })
      expect(onChange).toHaveBeenCalledWith(42, 'eq')
      vi.useRealTimers()
    })

    it('calls onChange with null for empty input', async () => {
      vi.useFakeTimers()
      const { onChange } = renderFilter({ value: 42 })
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '' } })
      await act(async () => { vi.runAllTimers() })
      expect(onChange).toHaveBeenCalledWith(null, 'eq')
      vi.useRealTimers()
    })

    it('fires with correct operator when gt is selected', async () => {
      vi.useFakeTimers()
      const { onChange } = renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      fireEvent.click(screen.getAllByRole('option')[1]) // gt
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '50' } })
      await act(async () => { vi.runAllTimers() })
      expect(onChange).toHaveBeenCalledWith(50, 'gt')
      vi.useRealTimers()
    })
  })

  describe('between operator', () => {
    it('renders two inputs when between is selected', () => {
      renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      fireEvent.click(screen.getAllByRole('option')[5]) // between
      expect(screen.getAllByRole('spinbutton')).toHaveLength(2)
    })

    it('calls onChange with [lo, hi] array when both inputs are filled', async () => {
      vi.useFakeTimers()
      const { onChange } = renderFilter()
      fireEvent.click(screen.getByRole('button', { name: /Filter operator/ }))
      fireEvent.click(screen.getAllByRole('option')[5]) // between
      const [minInput, maxInput] = screen.getAllByRole('spinbutton')
      fireEvent.change(minInput, { target: { value: '10' } })
      fireEvent.change(maxInput, { target: { value: '50' } })
      await act(async () => { vi.runAllTimers() })
      expect(onChange).toHaveBeenLastCalledWith([10, 50], 'between')
      vi.useRealTimers()
    })
  })

  describe('clear button', () => {
    it('shows clear button when there is a value', () => {
      renderFilter({ value: 42 })
      expect(screen.getByRole('button', { name: /Clear Amount filter/ })).toBeDefined()
    })

    it('hides clear button when value is null', () => {
      renderFilter()
      expect(screen.queryByRole('button', { name: /Clear/ })).toBeNull()
    })

    it('calls onChange with null when clear is clicked', () => {
      const { onChange } = renderFilter({ value: 42 })
      fireEvent.click(screen.getByRole('button', { name: /Clear Amount filter/ }))
      expect(onChange).toHaveBeenCalledWith(null, 'eq')
    })
  })

  describe('external value sync', () => {
    it('reflects externally set operator (e.g. from AI)', () => {
      renderFilter({ value: 100, operator: 'gte' })
      expect(screen.getByRole('button', { name: /Greater than or equal/ })).toBeDefined()
      const input = screen.getByRole('spinbutton') as HTMLInputElement
      expect(input.value).toBe('100')
    })

    it('populates both inputs when operator is between and value is an array', () => {
      renderFilter({ value: [10, 50], operator: 'between' })
      const [min, max] = screen.getAllByRole('spinbutton') as HTMLInputElement[]
      expect(min.value).toBe('10')
      expect(max.value).toBe('50')
    })
  })
})
