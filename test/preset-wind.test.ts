import { createGenerator, escapeSelector } from '@unocss/core'
import presetWind from '@unocss/preset-wind'
import { describe, expect, test } from 'vitest'
import { presetWindiTargets } from './preset-wind-targets'

const uno = createGenerator({
  presets: [
    presetWind({
      dark: 'media',
    }),
  ],
  theme: {
    colors: {
      custom: {
        a: 'var(--custom)',
        b: 'rgba(var(--custom), %alpha)',
      },
    },
  },
})

describe('preset-wind', () => {
  test('targets', async() => {
    const code = presetWindiTargets.join(' ')
    const { css } = await uno.generate(code)
    const { css: css2 } = await uno.generate(code)

    const unmatched = []
    for (const i of presetWindiTargets) {
      if (!css.includes(escapeSelector(i)))
        unmatched.push(i)
    }
    expect(unmatched).toEqual([])
    expect(css).toMatchSnapshot()
    expect(css).toEqual(css2)
  })

  test('containers', async() => {
    const targets = [
      'container',
      'md:container',
      'lg:container',
    ]
    const nonTargets = [
      '__container',
    ]
    const { css, matched } = await uno.generate(new Set([...targets, ...nonTargets]))

    expect(matched).toEqual(new Set(targets))
    expect(css).toMatchSnapshot()
  })
})
