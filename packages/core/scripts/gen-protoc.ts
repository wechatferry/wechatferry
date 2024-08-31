import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'pathe'
import fg from 'fast-glob'
import { $ } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))
const $$ = $({ cwd: resolve(__dirname, '../') })

export async function downloadProtoFile() {
  const protoList = await fg('*.proto', {
    cwd: resolve(__dirname, '../proto'),
  })
  const promises = protoList.map(async (proto) => {
    await $$`protoc --ts_out=${resolve(__dirname, '../src')} ${join('proto', proto)}`
  })
  return Promise.all(promises)
}

downloadProtoFile()
