import { tmpdir } from 'node:os'
import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { createConsola } from 'consola'
import type { FileBoxInterface } from 'file-box'
import { join } from 'pathe'
import { ensureDir } from 'fs-extra'

export const logger = createConsola({
  defaults: {
    tag: 'wechatferry',
  },
})

export async function saveFileBox(file: FileBoxInterface, dir = tmpdir()) {
  const dirPath = join(dir, 'wechatferry')
  const filePath = join(dirPath, `${new Date().getTime()}-${file.name}`)
  if (!existsSync(dirPath)) {
    await ensureDir(dirPath)
  }
  await file.toFile(filePath)
  return filePath
}

export function parseDbField(type: number, content: Uint8Array) {
  // self._SQL_TYPES = {1: int, 2: float, 3: lambda x: x.decode("utf-8"), 4: bytes, 5: lambda x: None}
  switch (type) {
    case 1:
      return Number.parseInt(uint8Array2str(content), 10)
    case 2:
      return Number.parseFloat(uint8Array2str(content))
    case 4:
      return Buffer.from(content)
    case 5:
      return undefined
    case 3:
    default:
      return uint8Array2str(content)
  }
}

export function uint8Array2str(arr: Uint8Array) {
  return Buffer.from(arr).toString()
}
