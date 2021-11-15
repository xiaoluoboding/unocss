import fs from 'fs'
import { resolve } from 'path'
import findUp from 'find-up'
import { UserConfig } from '@unocss/core'
import { transform } from 'sucrase'

export interface ConfigResult<U> {
  filepath?: string
  config?: U
}

function isDir(path: string) {
  try {
    const stat = fs.lstatSync(path)
    return stat.isDirectory()
  }
  catch (e) {
    return false
  }
}

export function loadConfig<U extends UserConfig>(dirOrPath: string | U = process.cwd()): ConfigResult<U> {
  if (typeof dirOrPath !== 'string') {
    return {
      config: dirOrPath,
    }
  }

  dirOrPath = resolve(dirOrPath)

  let filepath = isDir(dirOrPath)
    ? findUp.sync([
      'unocss.config.js',
      'unocss.config.cjs',
      'unocss.config.mjs',
      'unocss.config.ts',
      'unocss.config.mts',
      'unocss.config.cts',
    ], { cwd: dirOrPath! })
    : dirOrPath

  if (filepath && dirOrPath !== filepath)
    filepath = resolve(dirOrPath, filepath)

  if (!filepath || !fs.existsSync(filepath))
    return {}

  return readConfig<U>(filepath)
}

export function readConfig<U>(filepath: string): ConfigResult<U> {
  const content = fs.readFileSync(filepath, 'utf-8')
  const transformed = transform(content, { transforms: ['typescript', 'imports'] }).code

  // eslint-disable-next-line no-new-func
  const result = (new Function('require', `let exports = {};${transformed}; return exports.default;`))(require)

  return {
    filepath,
    config: result,
  }
}
