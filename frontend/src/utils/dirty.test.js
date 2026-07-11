import { describe, it, expect } from 'vitest'
import { isDirty } from './dirty'

describe('isDirty', () => {
  it('is false when current matches baseline', () => {
    expect(isDirty({ name: 'Jane', age: 30 }, { name: 'Jane', age: 30 })).toBe(false)
  })

  it('is true when a field differs', () => {
    expect(isDirty({ name: 'Jane', age: 31 }, { name: 'Jane', age: 30 })).toBe(true)
  })

  it('is order-sensitive, since it compares via JSON.stringify — forms must build both sides the same way', () => {
    expect(isDirty({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
  })
})
