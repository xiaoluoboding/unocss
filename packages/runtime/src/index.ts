import type { UnoGenerator, UserConfig, UserConfigDefaults } from '@unocss/core'
import { createGenerator } from '@unocss/core'

export interface RuntimeOptions {
  /**
   * Default config of UnoCSS
   */
  defaults?: UserConfigDefaults
}

export type RuntimeInspectorCallback = (element: Element) => boolean

declare global {
  interface Window {
    __unocss?: UserConfig & { runtime?: RuntimeOptions }
    __unocss_runtime?: {
      /**
       * The UnoCSS instance.
       *
       * @type {UnoGenerator}
       */
      uno: UnoGenerator

      /**
       * Rerun extractor on the whole <body>, regardless of paused status or inspection limitation.
       *
       * @returns {void}
       */
      extractAll: () => void

      /**
       * Set/unset inspection callback to allow/ignore element to be extracted.
       *
       * @param {RuntimeInspectorCallback} [callback] - Callback to determine whether the element will be extracted.
       *
       * @returns {void}
       */
      inspect: (callback?: RuntimeInspectorCallback) => void

      /**
       * Pause/resume/toggle the runtime.
       *
       * @param {boolean} [state] - False or True respectively pause or resume the runtime. Undefined parameter toggles the pause/resume state.
       *
       * @returns {void}
       */
      toggleObserver: (state?: boolean) => void

      /**
       * The UnoCSS version.
       *
       * @type {string}
       */
      version: string
    }
  }
}

export default function init(options: RuntimeOptions = {}) {
  if (typeof window == 'undefined') {
    console.warn('@unocss/runtime been used in non-browser environment, skipped.')
    return
  }

  Object.assign(options, window.__unocss?.runtime)

  let el: HTMLStyleElement | undefined
  let paused = false
  let inspector: RuntimeInspectorCallback | undefined

  const uno = createGenerator(window.__unocss || {}, options.defaults)
  const tokens = new Set<string>()

  let _timer: number | undefined
  function scheduleUpdate() {
    if (_timer != null)
      clearTimeout(_timer)
    _timer = setTimeout(updateStyle, 0) as any
  }

  async function updateStyle() {
    const result = await uno.generate(tokens)
    if (!el) {
      el = document.createElement('style')
      document.head.appendChild(el)
    }
    el.innerHTML = result.css
  }

  async function extract(str: string) {
    await uno.applyExtractors(str, undefined, tokens)
    scheduleUpdate()
  }

  function extractAll() {
    const html = document.body && document.body.outerHTML
    if (html)
      extract(html)
  }

  const mutationObserver = new MutationObserver((mutations) => {
    if (paused)
      return
    mutations.forEach((mutation) => {
      const target = mutation.target as Element
      if (target === el)
        return
      if (inspector && !inspector(target))
        return
      const attrs = Array.from(target.attributes)
        .map(i => i.value ? `${i.name}="${i.value}"` : i.name)
        .join(' ')
      const tag = `<${target.tagName.toLowerCase()} ${attrs}>`
      extract(tag)
    })
  })

  let observing = false
  function observe() {
    if (!observing)
      return
    const target = document.documentElement || document.body
    if (!target)
      return
    mutationObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    })
    observing = true
  }

  function execute() {
    extractAll()
    observe()
  }

  window.__unocss_runtime = window.__unocss_runtime = {
    version: uno.version,
    uno,
    extractAll,
    inspect(callback) {
      inspector = callback
    },
    toggleObserver(set) {
      if (set === undefined)
        paused = !paused
      else
        paused = !!set
    },
  }

  execute()
  window.addEventListener('load', execute)
  window.addEventListener('DOMContentLoaded', execute)
}
