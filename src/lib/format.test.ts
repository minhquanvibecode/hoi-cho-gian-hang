import { describe, expect, it } from 'vitest'
import { formatSigned, formatSignedVnd } from './format'

describe('Định dạng số có dấu', () => {
  it('âm dùng dấu trừ thật', () => {
    expect(formatSignedVnd(-122000)).toBe('−122.000 đ')
    expect(formatSigned(-0.12, 2)).toBe('−0,12')
  })
  it('dương / 0 giữ nguyên', () => {
    expect(formatSignedVnd(562000)).toBe('562.000 đ')
    expect(formatSigned(0)).toBe('0')
  })
})

describe('Nhãn triệu đồng', () => {
  it('dương và âm', async () => {
    const { formatMillion } = await import('./format')
    expect(formatMillion(1090000)).toBe('1,09tr')
    expect(formatMillion(-120000)).toBe('−0,12tr')
    expect(formatMillion(3875000)).toBe('3,88tr')
  })
})
