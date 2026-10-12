import { blankToNull } from '@/lib/text'

/** "Café Altura, Santiago" → name + city. Text without a comma is just the name. */
export function parseCafeInput(input: string) {
  const [name, ...rest] = input.split(',')
  return { name: name.trim(), city: blankToNull(rest.join(',')) }
}
