import type { Nitro } from 'nitropack'
import type { Nuxt } from 'nuxt/schema'
import { basename, extname, join, relative, resolve } from 'pathe'
import { camelCase } from 'scule'
import fb from 'fast-glob'

interface FileInfo { path: string, fullPath: string }
export const GLOB_SCAN_PATTERN = '**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'

async function scanDir(
  dir: string,
  name: string,
): Promise<FileInfo[]> {
  const fileNames = await fb(join(name, GLOB_SCAN_PATTERN), {
    cwd: dir,
    dot: true,
    absolute: true,
  })
  return fileNames
    .map((fullPath) => {
      return {
        fullPath,
        path: relative(join(dir, name), fullPath),
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))
}

export function setupVirtual(nuxt: Nuxt, nitro: Nitro) {
  const wcferryDirs = nitro.options.scanDirs.map(v => join(v, 'wcferry'))
  nuxt.options.watch.push(...wcferryDirs)

  nitro.options.virtual['#internal/wcferry/skills'] = async () => {
    const skills = (await Promise.all(wcferryDirs.map(dir => scanDir(dir, 'skills')))).flat()
    nitro.scannedSkills = skills.map((file) => {
      return {
        name: camelCase(basename(file.path, extname(file.path))),
        ...file,
      }
    })
    return skills.map(v => `import("${v.fullPath}");`).join('\n')
  }

  nitro.options.virtual['#internal/wcferry/middleware'] = async () => {
    const middleware = (await Promise.all(wcferryDirs.map(dir => scanDir(dir, 'middleware')))).flat()
    let importCode = ''
    const globalMiddleware: string[] = []
    const localMiddleware: string[] = []
    for (const file of middleware) {
      const base = basename(file.path, extname(file.path))
      const isGlobal = base.includes('.global')
      const name = camelCase(base.replace(/\.(global)/, ''))
      importCode += `import { default as ${name} } from "${file.fullPath}";\n`
      if (isGlobal) {
        globalMiddleware.push(name)
      }
      else {
        localMiddleware.push(name)
      }
    }
    importCode += `export const $global = [${globalMiddleware.join(',')}];\n`
    importCode += `export const $local = [${localMiddleware.join(',')}];\n`
    return importCode
  }

  nuxt.hook('builder:watch', (event, path) => {
    if (event !== 'change') {
      const fullPath = resolve(nuxt.options.srcDir, path)
      if (wcferryDirs.some(dir => fullPath.startsWith(dir))) {
        nitro.hooks.callHook('rollup:reload')
      }
    }
  })
}
