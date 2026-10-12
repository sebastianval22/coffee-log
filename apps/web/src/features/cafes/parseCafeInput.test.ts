import { describe, expect, it } from 'vitest'
import { parseCafeInput } from './parseCafeInput'

describe('parseCafeInput', () => {
  it('splits "name, city"', () => {
    expect(parseCafeInput('Café Altura, Santiago')).toEqual({ name: 'Café Altura', city: 'Santiago' })
  })

  it('treats text without a comma as the name only', () => {
    expect(parseCafeInput('  La Ciudad ')).toEqual({ name: 'La Ciudad', city: null })
  })

  it('keeps later commas in the city and ignores an empty city', () => {
    expect(parseCafeInput('Cuervo, Providencia, Santiago')).toEqual({ name: 'Cuervo', city: 'Providencia, Santiago' })
    expect(parseCafeInput('Cuervo, ')).toEqual({ name: 'Cuervo', city: null })
  })
})
