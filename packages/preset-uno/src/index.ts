import { presetWind } from '@unocss/preset-wind'
import type { PresetMiniOptions, Theme } from '@unocss/preset-mini'

export { theme, colors } from '@unocss/preset-wind'

export type { Theme }

export interface PresetUnoOptions extends PresetMiniOptions {}

export const presetUno = presetWind

export default presetUno
