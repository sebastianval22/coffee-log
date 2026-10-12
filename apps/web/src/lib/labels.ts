import type { Enums } from './database.types'

// Spanish UI labels for the database enums, in display order.

export const PROCESS_LABELS: Record<Enums<'process_t'>, string> = {
  washed: 'Lavado',
  natural: 'Natural',
  honey: 'Honey',
  anaerobic: 'Anaeróbico',
  wet_hulled: 'Wet hulled',
  other: 'Otro',
}

export const ROAST_LABELS: Record<Enums<'roast_t'>, string> = {
  light: 'Clara',
  medium_light: 'Media-clara',
  medium: 'Media',
  medium_dark: 'Media-oscura',
  dark: 'Oscura',
}

export const METHOD_LABELS: Record<Enums<'method_t'>, string> = {
  espresso: 'Espresso',
  v60: 'V60',
  chemex: 'Chemex',
  aeropress: 'AeroPress',
  french_press: 'Prensa francesa',
  moka: 'Moka',
  cold_brew: 'Cold brew',
  filter_machine: 'Cafetera de filtro',
  latte: 'Latte',
  cappuccino: 'Cappuccino',
  flat_white: 'Flat white',
  cortado: 'Cortado',
  other: 'Otro',
}

/** Suggestions for origin fields, so the same country is always spelled the same way. */
export const ORIGIN_COUNTRIES = [
  'Bolivia', 'Brasil', 'Burundi', 'China', 'Colombia', 'Costa Rica', 'Ecuador', 'El Salvador',
  'Etiopía', 'Guatemala', 'Honduras', 'India', 'Indonesia', 'Jamaica', 'Kenia', 'México',
  'Nicaragua', 'Panamá', 'Papúa Nueva Guinea', 'Perú', 'Ruanda', 'Tanzania', 'Uganda',
  'Vietnam', 'Yemen',
]
